import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const normalizeCode = (value) => value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

const parseCompanies = () => {
  if (process.env.SEED_COMPANIES_JSON) {
    const parsed = JSON.parse(process.env.SEED_COMPANIES_JSON);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("SEED_COMPANIES_JSON debe ser una lista de empresas");
    return parsed.map((company) => ({
      name: company.name?.trim(),
      tradeName: company.tradeName?.trim() || company.name?.trim(),
      code: normalizeCode(company.code || company.name || ""),
      rnc: company.rnc?.trim() || null,
      phone: company.phone?.trim() || null,
      email: company.email?.trim() || null,
      address: company.address?.trim() || null
    }));
  }

  const companyOne = process.env.SEED_COMPANY_1_NAME || "Negocio Principal";
  const companyTwo = process.env.SEED_COMPANY_2_NAME || "Segundo Negocio";
  return [
    {
      name: companyOne,
      tradeName: process.env.SEED_COMPANY_1_TRADE_NAME || companyOne,
      code: normalizeCode(process.env.SEED_COMPANY_1_CODE || "NEGOCIO1"),
      rnc: process.env.SEED_COMPANY_1_RNC || null,
      phone: process.env.SEED_COMPANY_1_PHONE || null,
      email: process.env.SEED_COMPANY_1_EMAIL || null,
      address: process.env.SEED_COMPANY_1_ADDRESS || null
    },
    {
      name: companyTwo,
      tradeName: process.env.SEED_COMPANY_2_TRADE_NAME || companyTwo,
      code: normalizeCode(process.env.SEED_COMPANY_2_CODE || "NEGOCIO2"),
      rnc: process.env.SEED_COMPANY_2_RNC || null,
      phone: process.env.SEED_COMPANY_2_PHONE || null,
      email: process.env.SEED_COMPANY_2_EMAIL || null,
      address: process.env.SEED_COMPANY_2_ADDRESS || null
    }
  ];
};

const ensureCompanySettings = async (company) => {
  await prisma.companySetting.upsert({
    where: { companyId: company.id },
    update: {
      businessName: company.name,
      tradeName: company.tradeName,
      rnc: company.rnc,
      phone: company.phone,
      email: company.email,
      address: company.address
    },
    create: {
      companyId: company.id,
      businessName: company.name,
      tradeName: company.tradeName,
      rnc: company.rnc,
      phone: company.phone,
      email: company.email,
      address: company.address,
      city: "Santo Domingo",
      country: "Republica Dominicana",
      currency: "DOP",
      currencySymbol: "RD$",
      defaultTaxRate: 18
    }
  });

  await prisma.documentSetting.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      invoiceTerms: "Pago segun condiciones acordadas.",
      invoiceNotes: "Gracias por su compra.",
      purchaseTerms: "Compra registrada en el sistema.",
      purchaseNotes: "Documento interno de compra.",
      footerText: "Documento generado desde Gestion Pro.",
      showLogo: true,
      showRnc: true,
      showAddress: true
    }
  });

  const existingTax = await prisma.taxSetting.findFirst({ where: { companyId: company.id, name: "ITBIS 18%" } });
  if (existingTax) {
    await prisma.taxSetting.update({
      where: { id: existingTax.id },
      data: { rate: 18, description: "Impuesto por defecto", isDefault: true, isActive: true }
    });
  } else {
    await prisma.taxSetting.create({
      data: { companyId: company.id, name: "ITBIS 18%", rate: 18, description: "Impuesto por defecto", isDefault: true, isActive: true }
    });
  }

  const numberingDefaults = [
    { documentType: "INVOICE", prefix: "FAC", nextNumber: 1 },
    { documentType: "PURCHASE", prefix: "COM", nextNumber: 1 },
    { documentType: "ACCOUNTING_ENTRY", prefix: "AST", nextNumber: 1 }
  ];
  for (const numbering of numberingDefaults) {
    await prisma.numberingSetting.upsert({
      where: { companyId_documentType: { companyId: company.id, documentType: numbering.documentType } },
      update: {},
      create: { ...numbering, companyId: company.id, padding: 6, isActive: true }
    });
  }

  await prisma.loyaltySetting.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      amountPerPoint: 100,
      rewardValue: 1,
      minimumPurchaseAmount: 100,
      allowRedeem: true,
      minimumRedeemAmount: 1,
      isActive: true
    }
  });
};

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@gestionpro.local").trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "GestionPro123";
  const adminName = process.env.SEED_ADMIN_NAME || "Administrador";
  const companies = parseCompanies();

  if (companies.some((company) => !company.name || !company.code)) {
    throw new Error("Cada empresa del seed necesita nombre y codigo");
  }

  const password = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      password,
      role: "admin",
      isActive: true,
      mustChangePassword: true,
      lastPasswordResetAt: new Date(),
      passwordChangedAt: null
    },
    create: {
      name: adminName,
      email: adminEmail,
      password,
      role: "admin",
      isActive: true,
      mustChangePassword: true,
      lastPasswordResetAt: new Date()
    }
  });

  for (const payload of companies) {
    const company = await prisma.company.upsert({
      where: { code: payload.code },
      update: { ...payload, isActive: true },
      create: { ...payload, isActive: true }
    });

    await prisma.userCompany.upsert({
      where: { userId_companyId: { userId: admin.id, companyId: company.id } },
      update: { role: "admin", isActive: true },
      create: { userId: admin.id, companyId: company.id, role: "admin", isActive: true }
    });

    await ensureCompanySettings(company);
  }

  console.log("Seed de Gestion Pro completado.");
  console.log(`Admin: ${adminEmail}`);
  console.log(`Companias: ${companies.map((company) => company.code).join(", ")}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
