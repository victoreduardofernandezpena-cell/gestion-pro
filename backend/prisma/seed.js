import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const clients = [
  { name: "Distribuidora Norte SRL", rnc: "131000001", phone: "809-555-0101", email: "compras@norte.test", address: "Santiago" },
  { name: "Comercial Atlantico", rnc: "131000002", phone: "809-555-0102", email: "info@atlantico.test", address: "Puerto Plata" },
  { name: "Servicios Duarte", rnc: "131000003", phone: "809-555-0103", email: "admin@duarte.test", address: "Santo Domingo" },
  { name: "Mercado Colonial", rnc: "131000004", phone: "809-555-0104", email: "ventas@colonial.test", address: "Zona Colonial" },
  { name: "Inversiones Cibao", rnc: "131000005", phone: "809-555-0105", email: "contacto@cibao.test", address: "La Vega" }
];

const products = [
  { code: "PRD-001", name: "Router empresarial", description: "Equipo de red para oficina", cost: 3200, price: 5200, stock: 30, minimumStock: 5 },
  { code: "PRD-002", name: "Impresora termica", description: "Impresora para punto de venta", cost: 4100, price: 6900, stock: 20, minimumStock: 4 },
  { code: "PRD-003", name: "Lector codigo de barras", description: "Scanner USB", cost: 1250, price: 2300, stock: 22, minimumStock: 6 },
  { code: "PRD-004", name: "Caja registradora", description: "Equipo POS compacto", cost: 7800, price: 11800, stock: 3, minimumStock: 4 },
  { code: "PRD-005", name: "Monitor 24 pulgadas", description: "Monitor FHD", cost: 5600, price: 8300, stock: 12, minimumStock: 3 },
  { code: "PRD-006", name: "Teclado mecanico", description: "Teclado para estaciones", cost: 950, price: 1700, stock: 30, minimumStock: 10 },
  { code: "PRD-007", name: "Mouse inalambrico", description: "Mouse ergonomico", cost: 420, price: 900, stock: 26, minimumStock: 8 },
  { code: "PRD-008", name: "UPS 1000VA", description: "Respaldo electrico", cost: 3600, price: 5900, stock: 4, minimumStock: 5 }
];

const suppliers = [
  { name: "Suplidora Tecnologia RD", rnc: "132000001", phone: "809-555-0201", email: "ventas@tecnologiard.test", address: "Santo Domingo" },
  { name: "Importadora Equipos del Caribe", rnc: "132000002", phone: "809-555-0202", email: "compras@equiposcaribe.test", address: "Santiago" },
  { name: "Mayorista Oficina Global", rnc: "132000003", phone: "809-555-0203", email: "info@oficinaglobal.test", address: "La Vega" }
];

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

async function createSeedInvoice({ invoiceNumber, clientRnc, items, status, paidAmount = 0, payment }) {
  const existing = await prisma.invoice.findUnique({ where: { invoiceNumber } });
  if (existing) return existing;

  return prisma.$transaction(async (tx) => {
    const client = await tx.client.findUnique({ where: { rnc: clientRnc } });
    if (!client) throw new Error(`Cliente seed no encontrado: ${clientRnc}`);

    const productCodes = items.map((item) => item.code);
    const products = await tx.product.findMany({ where: { code: { in: productCodes } } });
    const productMap = new Map(products.map((product) => [product.code, product]));

    const subtotal = roundMoney(items.reduce((sum, item) => sum + item.quantity * item.price, 0));
    const tax = roundMoney(subtotal * 0.18);
    const discount = 0;
    const total = roundMoney(subtotal + tax - discount);
    const balance = roundMoney(total - paidAmount);

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        clientId: client.id,
        subtotal,
        tax,
        discount,
        total,
        paidAmount,
        balance,
        status,
        notes: "Factura de prueba"
      }
    });

    for (const item of items) {
      const product = productMap.get(item.code);
      if (!product) throw new Error(`Producto seed no encontrado: ${item.code}`);

      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          productId: product.id,
          quantity: item.quantity,
          price: item.price,
          cost: product.cost,
          total: roundMoney(item.quantity * item.price)
        }
      });
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: item.quantity } }
      });
      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          type: "SALIDA",
          quantity: item.quantity,
          reason: `Factura #${invoiceNumber}`
        }
      });
    }

    if (payment) {
      await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: paidAmount,
          method: payment.method,
          reference: payment.reference,
          notes: payment.notes,
          paymentDate: new Date()
        }
      });
    }

    return invoice;
  });
}

async function createSeedPurchase({ purchaseNumber, supplierRnc, items, status, paidAmount = 0, payment }) {
  const existing = await prisma.purchase.findUnique({ where: { purchaseNumber } });
  if (existing) return existing;

  return prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.findUnique({ where: { rnc: supplierRnc } });
    if (!supplier) throw new Error(`Proveedor seed no encontrado: ${supplierRnc}`);

    const productCodes = items.map((item) => item.code);
    const products = await tx.product.findMany({ where: { code: { in: productCodes } } });
    const productMap = new Map(products.map((product) => [product.code, product]));

    const subtotal = roundMoney(items.reduce((sum, item) => sum + item.quantity * item.cost, 0));
    const tax = roundMoney(subtotal * 0.18);
    const discount = 0;
    const total = roundMoney(subtotal + tax - discount);
    const balance = roundMoney(total - paidAmount);

    const purchase = await tx.purchase.create({
      data: {
        purchaseNumber,
        supplierId: supplier.id,
        subtotal,
        tax,
        discount,
        total,
        paidAmount,
        balance,
        status,
        notes: "Compra de prueba"
      }
    });

    for (const item of items) {
      const product = productMap.get(item.code);
      if (!product) throw new Error(`Producto seed no encontrado: ${item.code}`);

      await tx.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          productId: product.id,
          quantity: item.quantity,
          cost: item.cost,
          total: roundMoney(item.quantity * item.cost)
        }
      });
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { increment: item.quantity }, cost: item.cost }
      });
      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          type: "ENTRADA",
          quantity: item.quantity,
          reason: `Compra #${purchaseNumber}`
        }
      });
    }

    if (payment) {
      await tx.purchasePayment.create({
        data: {
          purchaseId: purchase.id,
          amount: paidAmount,
          method: payment.method,
          reference: payment.reference,
          notes: payment.notes,
          paymentDate: new Date()
        }
      });
    }

    return purchase;
  });
}

async function seedFinanceData() {
  const mainBank = await prisma.bankAccount.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Cuenta Operativa",
      bankName: "Banco Nacional",
      accountNumber: "001-000001-1",
      currency: "DOP",
      initialBalance: 150000,
      currentBalance: 150000
    }
  });

  const secondaryBank = await prisma.bankAccount.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Cuenta Ahorro",
      bankName: "Banco Comercial",
      accountNumber: "002-000002-2",
      currency: "DOP",
      initialBalance: 85000,
      currentBalance: 85000
    }
  });

  const adminCash = await prisma.cashBox.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Caja Administrativa",
      description: "Caja para gastos menores",
      initialBalance: 25000,
      currentBalance: 25000
    }
  });

  const salesCash = await prisma.cashBox.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Caja Ventas",
      description: "Caja para operaciones de ventas",
      initialBalance: 18000,
      currentBalance: 18000
    }
  });

  const bankMovementCount = await prisma.bankTransaction.count();
  if (bankMovementCount === 0) {
    await prisma.bankTransaction.createMany({
      data: [
        { bankAccountId: mainBank.id, type: "DEPOSIT", amount: 50000, description: "Deposito inicial adicional", reference: "DEP-001", transactionDate: new Date() },
        { bankAccountId: mainBank.id, type: "WITHDRAWAL", amount: 12000, description: "Retiro operativo", reference: "RET-001", transactionDate: new Date() },
        { bankAccountId: secondaryBank.id, type: "DEPOSIT", amount: 20000, description: "Deposito ahorro", reference: "DEP-002", transactionDate: new Date() },
        { bankAccountId: mainBank.id, type: "TRANSFER_OUT", amount: 10000, description: "Transferencia a ahorro", reference: "TRF-001", transactionDate: new Date() },
        { bankAccountId: secondaryBank.id, type: "TRANSFER_IN", amount: 10000, description: "Transferencia desde operativa", reference: "TRF-001", transactionDate: new Date() }
      ]
    });
    await prisma.bankAccount.update({ where: { id: mainBank.id }, data: { currentBalance: 178000 } });
    await prisma.bankAccount.update({ where: { id: secondaryBank.id }, data: { currentBalance: 115000 } });
  }

  const cashMovementCount = await prisma.cashTransaction.count();
  if (cashMovementCount === 0) {
    await prisma.cashTransaction.createMany({
      data: [
        { cashBoxId: adminCash.id, type: "CASH_IN", amount: 5000, description: "Reposicion caja", reference: "CJ-001", transactionDate: new Date() },
        { cashBoxId: adminCash.id, type: "CASH_OUT", amount: 1500, description: "Mensajeria", reference: "CJ-002", transactionDate: new Date() },
        { cashBoxId: salesCash.id, type: "CASH_IN", amount: 3000, description: "Entrada menor", reference: "CJ-003", transactionDate: new Date() },
        { cashBoxId: salesCash.id, type: "CASH_OUT", amount: 1000, description: "Material oficina", reference: "CJ-004", transactionDate: new Date() },
        { cashBoxId: adminCash.id, type: "ADJUSTMENT", amount: 500, description: "Ajuste de cuadre", reference: "CJ-005", transactionDate: new Date() }
      ]
    });
    await prisma.cashBox.update({ where: { id: adminCash.id }, data: { currentBalance: 29000 } });
    await prisma.cashBox.update({ where: { id: salesCash.id }, data: { currentBalance: 20000 } });
  }

  const expenseCount = await prisma.expense.count();
  if (expenseCount === 0) {
    await prisma.expense.createMany({
      data: [
        { category: "RENT", description: "Alquiler oficina", amount: 25000, paymentSource: "BANK", bankAccountId: mainBank.id, reference: "G-001", expenseDate: new Date() },
        { category: "SERVICES", description: "Internet", amount: 4200, paymentSource: "BANK", bankAccountId: mainBank.id, reference: "G-002", expenseDate: new Date() },
        { category: "TRANSPORT", description: "Transporte local", amount: 1800, paymentSource: "CASH_BOX", cashBoxId: adminCash.id, reference: "G-003", expenseDate: new Date() },
        { category: "SUPPLIES", description: "Papeleria", amount: 2300, paymentSource: "CASH_BOX", cashBoxId: salesCash.id, reference: "G-004", expenseDate: new Date() },
        { category: "MAINTENANCE", description: "Mantenimiento equipos", amount: 7600, paymentSource: "BANK", bankAccountId: secondaryBank.id, reference: "G-005", expenseDate: new Date() },
        { category: "TAXES", description: "Tasa municipal", amount: 3500, paymentSource: "BANK", bankAccountId: mainBank.id, reference: "G-006", expenseDate: new Date() },
        { category: "SALARY", description: "Apoyo temporal", amount: 12000, paymentSource: "OTHER", reference: "G-007", expenseDate: new Date() },
        { category: "OTHER", description: "Gasto miscelaneo", amount: 950, paymentSource: "CASH_BOX", cashBoxId: adminCash.id, reference: "G-008", expenseDate: new Date() }
      ]
    });
    await prisma.bankAccount.update({ where: { id: mainBank.id }, data: { currentBalance: 145300 } });
    await prisma.bankAccount.update({ where: { id: secondaryBank.id }, data: { currentBalance: 107400 } });
    await prisma.cashBox.update({ where: { id: adminCash.id }, data: { currentBalance: 26250 } });
    await prisma.cashBox.update({ where: { id: salesCash.id }, data: { currentBalance: 17700 } });
  }
}

async function main() {
  const password = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {
      name: "Administrador",
      password,
      role: "admin"
    },
    create: {
      name: "Administrador",
      email: "admin@demo.com",
      password,
      role: "admin"
    }
  });

  for (const client of clients) {
    await prisma.client.upsert({
      where: { rnc: client.rnc },
      update: client,
      create: client
    });
  }

  for (const product of products) {
    await prisma.product.upsert({
      where: { code: product.code },
      update: product,
      create: product
    });
  }

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { rnc: supplier.rnc },
      update: supplier,
      create: supplier
    });
  }

  const router = await prisma.product.findUnique({ where: { code: "PRD-001" } });
  const printer = await prisma.product.findUnique({ where: { code: "PRD-002" } });
  const ups = await prisma.product.findUnique({ where: { code: "PRD-008" } });

  await prisma.inventoryMovement.createMany({
    data: [
      { productId: router.id, type: "ENTRADA", quantity: 10, reason: "Compra inicial" },
      { productId: printer.id, type: "SALIDA", quantity: 2, reason: "Venta mostrador" },
      { productId: ups.id, type: "AJUSTE", quantity: 4, reason: "Conteo fisico inicial" }
    ],
    skipDuplicates: true
  });

  await createSeedInvoice({
    invoiceNumber: "FAC-000001",
    clientRnc: "131000001",
    status: "PENDING",
    items: [
      { code: "PRD-001", quantity: 1, price: 5200 },
      { code: "PRD-003", quantity: 2, price: 2300 }
    ]
  });

  await createSeedPurchase({
    purchaseNumber: "COM-000001",
    supplierRnc: "132000001",
    status: "PENDING",
    items: [
      { code: "PRD-001", quantity: 4, cost: 3100 },
      { code: "PRD-006", quantity: 10, cost: 900 }
    ]
  });

  await createSeedPurchase({
    purchaseNumber: "COM-000002",
    supplierRnc: "132000002",
    status: "PARTIAL",
    paidAmount: 8000,
    payment: { method: "BANK_TRANSFER", reference: "CP-001", notes: "Abono compra" },
    items: [
      { code: "PRD-002", quantity: 3, cost: 4000 },
      { code: "PRD-008", quantity: 2, cost: 3500 }
    ]
  });

  await createSeedInvoice({
    invoiceNumber: "FAC-000002",
    clientRnc: "131000002",
    status: "PARTIAL",
    paidAmount: 5000,
    payment: { method: "CASH", reference: "ABONO-001", notes: "Abono inicial" },
    items: [
      { code: "PRD-002", quantity: 1, price: 6900 },
      { code: "PRD-007", quantity: 3, price: 900 }
    ]
  });

  await createSeedInvoice({
    invoiceNumber: "FAC-000003",
    clientRnc: "131000003",
    status: "PAID",
    paidAmount: 13806,
    payment: { method: "BANK_TRANSFER", reference: "TRX-001", notes: "Pago completo" },
    items: [
      { code: "PRD-005", quantity: 1, price: 8300 },
      { code: "PRD-006", quantity: 2, price: 1700 }
    ]
  });

  await seedFinanceData();
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
