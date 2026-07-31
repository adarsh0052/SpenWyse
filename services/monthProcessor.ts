import { supabase } from './supabase';

export const checkAndProcessMonthEnd =
  async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const {
        data: profile,
        error,
      } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !profile) return;

      const now = new Date();

      const currentMonth =
        now.getMonth() + 1;

      const currentYear =
        now.getFullYear();

      const monthChanged =
        profile.last_processed_month !==
          currentMonth ||
        profile.last_processed_year !==
          currentYear;

      if (!monthChanged) return;

      console.log(
        'MONTH CHANGE DETECTED'
      );
      
      await createMonthlySnapshot(
        user.id,
        profile
      );
      await supabase
  .from('profiles')
  .update({
    last_processed_month:
      currentMonth,

    last_processed_year:
      currentYear,

    reward_pending:
      true,
  })
  .eq('id', user.id);

    } catch (err) {
      console.log(err);
    }
  };

  const createMonthlySnapshot =
  async (
    userId: string,
    profile: any
  ) => {
    const now = new Date();

    const snapshotMonth =
      profile.last_processed_month;

    const snapshotYear =
      profile.last_processed_year;

    // Optimized: Query only the target month's expenses instead of fetching all historical data
    const startDate = new Date(snapshotYear, snapshotMonth - 1, 1).toISOString();
    const endDate = new Date(snapshotYear, snapshotMonth, 0, 23, 59, 59, 999).toISOString();

    const {
      data: expenses,
    } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // allocations
    const {
      data: allocations,
    } = await supabase
      .from('allocations')
      .select('*')
      .eq('user_id', userId);

    const locked =
      (allocations || [])
        .reduce(
          (sum, item) =>
            sum +
            Number(item.amount || 0),
          0
        );

    const foodSpent =
      (expenses || [])
        .filter(
          e =>
            e.category ===
            'Food'
        )
        .reduce(
          (s, e) =>
            s +
            Number(e.amount),
          0
        );

    const shoppingSpent =
      (expenses || [])
        .filter(
          e =>
            e.category ===
            'Shopping'
        )
        .reduce(
          (s, e) =>
            s +
            Number(e.amount),
          0
        );

    const transportSpent =
      (expenses || [])
        .filter(
          e =>
            e.category ===
            'Transport'
        )
        .reduce(
          (s, e) =>
            s +
            Number(e.amount),
          0
        );

    const billsSpent =
      (expenses || [])
        .filter(
          e =>
            e.category ===
            'Bills'
        )
        .reduce(
          (s, e) =>
            s +
            Number(e.amount),
          0
        );

    const healthSpent =
      (expenses || [])
        .filter(
          e =>
            e.category ===
            'Health'
        )
        .reduce(
          (s, e) =>
            s +
            Number(e.amount),
          0
        );

    const othersSpent =
      (expenses || [])
        .filter(
          e =>
            e.category ===
            'Others'
        )
        .reduce(
          (s, e) =>
            s +
            Number(e.amount),
          0
        );

    const income =
      Number(
        profile.monthly_income || 0
      );

    const spent =
      Number(
        profile.current_month_spent || 0
      );

    const saved =
      Math.max(
        income -
          spent,
        0
      );

    const { error } =
      await supabase
        .from(
          'monthly_snapshots'
        )
        .insert({
          user_id: userId,

          month:
            snapshotMonth,

          year:
            snapshotYear,

          income,
          spent,
          locked,
          saved,

          food_spent:
            foodSpent,

          shopping_spent:
            shoppingSpent,

          transport_spent:
            transportSpent,

          bills_spent:
            billsSpent,

          health_spent:
            healthSpent,

          others_spent:
            othersSpent,

          streak: 0,
        });

    if (error) {
      console.log(
        'SNAPSHOT ERROR',
        error
      );
    } else {
      console.log(
        'SNAPSHOT CREATED'
      );
    }
  };