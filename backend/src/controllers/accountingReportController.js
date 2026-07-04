import prisma from "../prisma.js";

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const getPostedLines = async () => {
  return prisma.accountingEntryLine.findMany({
    where: { entry: { status: "POSTED" } },
    include: {
      account: { select: { id: true, code: true, name: true, type: true } }
    },
    orderBy: { account: { code: "asc" } }
  });
};

const summarizeByAccount = (lines) => {
  const accountMap = new Map();

  for (const line of lines) {
    const current = accountMap.get(line.accountId) || {
      accountId: line.accountId,
      code: line.account.code,
      name: line.account.name,
      type: line.account.type,
      totalDebit: 0,
      totalCredit: 0,
      balance: 0
    };
    current.totalDebit = roundMoney(current.totalDebit + Number(line.debit));
    current.totalCredit = roundMoney(current.totalCredit + Number(line.credit));
    current.balance = roundMoney(current.totalDebit - current.totalCredit);
    accountMap.set(line.accountId, current);
  }

  return [...accountMap.values()].sort((a, b) => a.code.localeCompare(b.code));
};

export const getTrialBalance = async (req, res, next) => {
  try {
    const rows = summarizeByAccount(await getPostedLines());
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const getIncomeStatement = async (req, res, next) => {
  try {
    const rows = summarizeByAccount(await getPostedLines()).filter((row) => ["INCOME", "EXPENSE"].includes(row.type));
    const totalIncome = roundMoney(rows.filter((row) => row.type === "INCOME").reduce((sum, row) => sum + row.totalCredit - row.totalDebit, 0));
    const totalExpenses = roundMoney(rows.filter((row) => row.type === "EXPENSE").reduce((sum, row) => sum + row.totalDebit - row.totalCredit, 0));

    res.json({
      totalIncome,
      totalExpenses,
      netResult: roundMoney(totalIncome - totalExpenses),
      rows
    });
  } catch (error) {
    next(error);
  }
};

export const getAccountSummary = async (req, res, next) => {
  try {
    const rows = summarizeByAccount(await getPostedLines());
    const sumType = (type) => {
      const total = rows
        .filter((row) => row.type === type)
        .reduce((sum, row) => {
          if (["LIABILITY", "EQUITY", "INCOME"].includes(type)) return sum + row.totalCredit - row.totalDebit;
          return sum + row.totalDebit - row.totalCredit;
        }, 0);
      return roundMoney(total);
    };

    res.json({
      totalAssets: sumType("ASSET"),
      totalLiabilities: sumType("LIABILITY"),
      totalEquity: sumType("EQUITY"),
      totalIncome: sumType("INCOME"),
      totalExpenses: sumType("EXPENSE")
    });
  } catch (error) {
    next(error);
  }
};
