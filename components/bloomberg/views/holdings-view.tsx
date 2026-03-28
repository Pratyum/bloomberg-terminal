"use client";

import { useEffect, useState } from "react";
import { bloombergColors } from "../lib/theme-config";
import type { HoldingsItem } from "../types";

type HoldingsViewProps = {
  isDarkMode: boolean;
  onBack: () => void;
};

export default function HoldingsView({ isDarkMode, onBack }: HoldingsViewProps) {
  const [holdings, setHoldings] = useState<HoldingsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loginUrl, setLoginUrl] = useState<string | null>(null);
  const colors = isDarkMode ? bloombergColors.dark : bloombergColors.light;
  const secondaryBg = isDarkMode ? "#1e1e1e" : "#e0e0e0";
  const rowHover = isDarkMode ? "#2a2a2a" : "#d5d5d5";

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/kite");
      const data = await response.json();

      if (data.loginUrl) {
        setLoginUrl(data.loginUrl);
      }
    } catch (err) {
      console.error("Error checking KITE connection:", err);
    }
  };

  const fetchHoldings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const storedUserId = localStorage.getItem("kite_user_id");

      if (!storedUserId) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/kite/holdings?userId=${storedUserId}`);

      if (!response.ok) {
        const data = await response.json();
        if (data.code === "NO_SESSION") {
          setIsConnected(false);
          localStorage.removeItem("kite_user_id");
        } else {
          setError(data.error || "Failed to fetch holdings");
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setHoldings(data.holdings || []);
      setIsConnected(true);
    } catch (err) {
      setError("Failed to fetch holdings");
      console.error("Error fetching holdings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    if (loginUrl) {
      window.open(loginUrl, "_blank", "width=600,height=700");
    }
  };

  const handleOAuthCallback = async (requestToken: string) => {
    try {
      const response = await fetch("/api/kite/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestToken }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("kite_user_id", data.userId);
        setIsConnected(true);
        fetchHoldings();
      } else {
        setError(data.error || "Failed to connect");
      }
    } catch (err) {
      setError("Failed to complete authentication");
      console.error("Error in OAuth callback:", err);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchHoldings();
    }
  }, [isConnected]);

  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === "kite_oauth_callback") {
        handleOAuthCallback(event.data.requestToken);
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [isConnected]);

  const totalValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
  const totalPnL = holdings.reduce((sum, h) => sum + h.pnl, 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.average_price * h.quantity, 0);
  const overallPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  if (!isConnected) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold" style={{ color: colors.text }}>
              My Profile Holdings
            </h2>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Connect your KITE account to view your holdings
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium rounded"
            style={{ backgroundColor: secondaryBg, color: colors.text }}
          >
            Back
          </button>
        </div>

        <div className="p-8 rounded-lg text-center" style={{ backgroundColor: secondaryBg }}>
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12"
              style={{ color: colors.accent }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
            Connect to KITE
          </h3>
          <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
            Link your Zerodha KITE account to view your portfolio holdings
          </p>
          <button
            onClick={handleConnect}
            className="px-6 py-2 rounded font-medium text-white"
            style={{ backgroundColor: colors.accent }}
          >
            Connect KITE Account
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: colors.text }}>
            My Profile Holdings
          </h2>
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium rounded"
            style={{ backgroundColor: secondaryBg, color: colors.text }}
          >
            Back
          </button>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-center">
            <p className="text-lg font-mono" style={{ color: colors.textSecondary }}>
              Loading holdings...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: colors.text }}>
            My Profile Holdings
          </h2>
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium rounded"
            style={{ backgroundColor: secondaryBg, color: colors.text }}
          >
            Back
          </button>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: "#451a1a" }}>
          <p className="text-red-400 font-mono">{error}</p>
          <button
            onClick={fetchHoldings}
            className="mt-4 px-4 py-2 text-sm rounded"
            style={{ backgroundColor: colors.accent, color: "white" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: colors.text }}>
            My Profile Holdings
          </h2>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Your KITE portfolio holdings
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium rounded"
          style={{ backgroundColor: secondaryBg, color: colors.text }}
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg" style={{ backgroundColor: secondaryBg }}>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Total Value
          </p>
          <p className="text-xl font-bold" style={{ color: colors.text }}>
            ₹{totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: secondaryBg }}>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Total P&L
          </p>
          <p className="text-xl font-bold" style={{ color: totalPnL >= 0 ? "#22c55e" : "#ef4444" }}>
            {totalPnL >= 0 ? "+" : ""}₹
            {totalPnL.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: secondaryBg }}>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Overall Return
          </p>
          <p
            className="text-xl font-bold"
            style={{ color: overallPnLPercent >= 0 ? "#22c55e" : "#ef4444" }}
          >
            {overallPnLPercent >= 0 ? "+" : ""}
            {overallPnLPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-left"
              style={{
                backgroundColor: secondaryBg,
                color: colors.textSecondary,
              }}
            >
              <th className="px-4 py-2 font-medium">Symbol</th>
              <th className="px-4 py-2 font-medium">Qty</th>
              <th className="px-4 py-2 font-medium">Avg Price</th>
              <th className="px-4 py-2 font-medium">LTP</th>
              <th className="px-4 py-2 font-medium">Current Value</th>
              <th className="px-4 py-2 font-medium">P&L</th>
              <th className="px-4 py-2 font-medium">Return %</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding, index) => (
              <tr
                key={`${holding.exchange}:${holding.trading_symbol}`}
                className="border-b"
                style={{
                  borderColor: colors.border,
                  backgroundColor: index % 2 === 0 ? "transparent" : rowHover,
                }}
              >
                <td className="px-4 py-2">
                  <span style={{ color: colors.text }} className="font-medium">
                    {holding.trading_symbol}
                  </span>
                  <span className="ml-2 text-xs" style={{ color: colors.textSecondary }}>
                    {holding.exchange}
                  </span>
                </td>
                <td className="px-4 py-2" style={{ color: colors.text }}>
                  {holding.quantity}
                </td>
                <td className="px-4 py-2" style={{ color: colors.text }}>
                  ₹{holding.average_price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-2" style={{ color: colors.text }}>
                  ₹{holding.last_price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-2" style={{ color: colors.text }}>
                  ₹{holding.current_value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </td>
                <td
                  className="px-4 py-2 font-medium"
                  style={{ color: holding.pnl >= 0 ? "#22c55e" : "#ef4444" }}
                >
                  {holding.pnl >= 0 ? "+" : ""}₹
                  {holding.pnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </td>
                <td
                  className="px-4 py-2 font-medium"
                  style={{ color: holding.pnl_percent >= 0 ? "#22c55e" : "#ef4444" }}
                >
                  {holding.pnl_percent >= 0 ? "+" : ""}
                  {holding.pnl_percent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
