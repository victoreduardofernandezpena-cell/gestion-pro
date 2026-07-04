export const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const calculateLoyaltyReward = (paidAmount, setting) => {
  const amount = Number(paidAmount);
  const amountPerPoint = Number(setting?.amountPerPoint || 100);
  const rewardValue = Number(setting?.rewardValue || 1);
  const minimumPurchaseAmount = Number(setting?.minimumPurchaseAmount || 100);

  if (!setting?.isActive || amount < minimumPurchaseAmount || amountPerPoint <= 0 || rewardValue <= 0) {
    return 0;
  }

  return roundMoney(Math.floor(amount / amountPerPoint) * rewardValue);
};

export const getActiveLoyaltySetting = async (tx, companyId) => {
  const companyWhere = companyId ? { companyId } : {};
  let setting = await tx.loyaltySetting.findFirst({ where: { ...companyWhere, isActive: true }, orderBy: { id: "desc" } });
  if (!setting) {
    setting = await tx.loyaltySetting.create({
      data: {
        ...(companyId ? { companyId } : {}),
        amountPerPoint: 100,
        rewardValue: 1,
        minimumPurchaseAmount: 100,
        allowRedeem: true,
        minimumRedeemAmount: 1,
        isActive: true
      }
    });
  }
  return setting;
};
