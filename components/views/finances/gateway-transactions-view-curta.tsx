"chargeback";
      const createdAtDate = t.created_at ? new Date(t.created_at) : null;
      const inDateRange =
        createdAtDate && (!period?.from || createdAtDate >= period.from) && (!period?.to || createdAtDate <= period.to);
      const matchesGateway = selectedGateway === "all" || t.gateway_id === selectedGateway;
      return isChargeback && inDateRange && matchesGateway;
    });

    return {
      totalAmount: stats.totalRevenue,
      totalTransactions: stats.totalTransactions,
      totalFees: stats.totalFees,
      netAmount: realNetAmount,
      uncompletedSalesAmount: stats.pendingAmount + stats.failedAmount,
      totalAbandonedTransactions: abandonedTransactions.length,
      abandonedAmount: abandonedTransactions.reduce((sum, t) => sum + Number(t.product_price || 0), 0),
      refusedTransactions: stats.refusedTransactions,
      refusedAmount: stats.refusedAmount,
      totalRefunds: stats.totalRefunds,
      refundedAmount: stats.refundedAmount,
      totalChargebacks: chargebackTransactions.length,
      chargebackAmount: chargebackTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0),
    };
  };

  const [summary, setSummary] = useState(() => {
    if (dateRange?.from && dateRange?.to) {
      return getConsolidatedSummary({ from: dateRange.from, to: dateRange.to });
    }
    return {
      totalAmount: 0,
      totalTransactions: 0,
      totalFees: 0,
      netAmount: 0,
      uncompletedSalesAmount: 0,
      totalAbandonedTransactions: 0,
      abandonedAmount: 0,
      refusedTransactions: 0,
      refusedAmount: 0,
      totalRefunds: 0,
      refundedAmount: 0,
      totalChargebacks: 0,
      chargebackAmount: 0,
    };
  });

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      setSummary(getConsolidatedSummary({ from: dateRange.from, to: dateRange.to }));
    }
  }, [dateRange, selectedGateway, selectedPeriod, transactions]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <TabsContent value="abandoned" className="space-y-6">
      <Card className="neon-card neon-card-red">
        <CardHeader>
          <CardTitle>Vendas Abandonadas e Recusadas</CardTitle>
          <CardDescription>Transações de checkout Abandonado e Recusado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8 max-h-[400px] overflow-y-auto">
            {/* --- ABANDONADAS --- */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-muted-foreground">
                Abandonadas ({summary.totalAbandonedTransactions ?? 0})
              </div>
              {getFilteredTransactions({
                status: "abandoned",
                gateway: selectedGateway === "all" ? undefined : selectedGateway,
                period: dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined,
              }).map((transaction, index) => {
                const gateway = gatewayConfigs.find((gc) => gc.id === transaction.gateway_id);
                return (
                  <div key={`ab-${index}`} className="block border rounded-md p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">
                        {transaction.product_name}{" "}
                        <span className="text-red-500 text-xs">(Abandonada)</span>
                      </div>
                      <div className="font-bold">
                        {formatCurrency(transaction.product_price ?? transaction.amount ?? 0)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      <div className="text-muted-foreground">Data:</div>
                      <div>{new Date(transaction.created_at).toLocaleDateString("pt-BR")}</div>
                      <div className="text-muted-foreground">Cliente:</div>
                      <div>{transaction.customer_name}</div>
                      <div className="text-muted-foreground">Email:</div>
                      <div>{transaction.customer_email}</div>
                      <div className="text-muted-foreground">Telefone:</div>
                      <div>{transaction.customer_phone || "N/A"}</div>
                      <div className="text-muted-foreground">Gateway:</div>
                      <div>
                        <span className="inline-flex items-center">
                          <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: gateway?.color || "#ccc" }} />
                          {gateway?.name || transaction.gateway_id}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* --- RECUSADAS --- */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-muted-foreground">
                Recusadas ({summary.refusedTransactions ?? 0})
              </div>
              {getFilteredTransactions({
                status: "refused",
                gateway: selectedGateway === "all" ? undefined : selectedGateway,
                period: dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined,
              }).map((transaction, index) => {
                const gateway = gatewayConfigs.find((gc) => gc.id === transaction.gateway_id);
                return (
                  <div key={`rf-${index}`} className="block border rounded-md p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">
                        {transaction.product_name}{" "}
                        <span className="text-red-500 text-xs">(Recusada)</span>
                      </div>
                      <div className="font-bold">
                        {formatCurrency(transaction.amount ?? transaction.product_price ?? 0)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      <div className="text-muted-foreground">Data:</div>
                      <div>{new Date(transaction.created_at).toLocaleDateString("pt-BR")}</div>
                      <div className="text-muted-foreground">Cliente:</div>
                      <div>{transaction.customer_name}</div>
                      <div className="text-muted-foreground">Email:</div>
                      <div>{transaction.customer_email}</div>
                      <div className="text-muted-foreground">Telefone:</div>
                      <div>{transaction.customer_phone || "N/A"}</div>
                      <div className="text-muted-foreground">Gateway:</div>
                      <div>
                        <span className="inline-flex items-center">
                          <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: gateway?.color || "#ccc" }} />
                          {gateway?.name || transaction.gateway_id}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
