export const getRemainingDaysInMonth = () => {
  const today = new Date();

  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();

  return daysInMonth - today.getDate() + 1;
};

export const calculateFinanceSnapshot = ({
  income,
  commitments,
  spent,
}: {
  income: number;
  commitments: number;
  spent: number;
}) => {
  const remainingDays =
    getRemainingDaysInMonth();

  const flexiblePool =
    income -
    commitments -
    spent;

  const dailySpendLimit =
    remainingDays > 0
      ? Math.max(
          Math.floor(
            flexiblePool /
              remainingDays
          ),
          0
        )
      : 0;

  return {
    income,
    commitments,
    spent,
    flexiblePool,
    remainingDays,
    dailySpendLimit,
  };
};