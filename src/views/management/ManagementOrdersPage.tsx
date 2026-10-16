import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Save,
  RotateCcw,
  Truck,
  Eye,
  Clock,
  CreditCard,
  MapPin,
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus } from '../../types/commerce';

export const ManagementOrdersPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');

  // Status Modal State
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<Order | null>(null);
  const [newOrderStatus, setNewOrderStatus] = useState<OrderStatus>('PROCESSING');
  const [statusNotes, setStatusNotes] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Refund Modal State
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  // Order Details Modal State
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);

  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOrders = async () => {
    if (!user || !profile) return;
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set('search', search.trim());
      if (orderStatusFilter !== 'ALL') queryParams.set('orderStatus', orderStatusFilter);
      if (paymentStatusFilter !== 'ALL') queryParams.set('paymentStatus', paymentStatusFilter);

      const res = await fetch(`/api/management/orders?${queryParams.toString()}`, {
        headers: {
          'x-user-id': user.uid,
          'x-user-role': profile.role || '',
          'x-user-email': user.email || '',
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading orders';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, profile, orderStatusFilter, paymentStatusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForStatus || !user || !profile) return;

    setSubmittingStatus(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/management/orders/${selectedOrderForStatus.orderId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-role': profile.role || '',
          'x-user-email': user.email || '',
        },
        body: JSON.stringify({
          status: newOrderStatus,
          notes: statusNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update order status');
      }

      setActionFeedback({
        type: 'success',
        text: `Order ${selectedOrderForStatus.orderReference} updated to ${newOrderStatus}.`,
      });
      setSelectedOrderForStatus(null);
      setStatusNotes('');
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating order status';
      setActionFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForRefund || !user || !profile) return;
    if (!refundReason.trim() || refundReason.trim().length < 5) {
      setActionFeedback({ type: 'error', text: 'A refund reason of at least 5 characters is required.' });
      return;
    }

    setSubmittingRefund(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/management/orders/${selectedOrderForRefund.orderId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'x-user-role': profile.role || '',
          'x-user-email': user.email || '',
        },
        body: JSON.stringify({
          reason: refundReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process refund');
      }

      setActionFeedback({
        type: 'success',
        text: `Refund processed for order ${selectedOrderForRefund.orderReference}.`,
      });
      setSelectedOrderForRefund(null);
      setRefundReason('');
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing refund';
      setActionFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingRefund(false);
    }
  };

  const formatNaira = (amount: number) => `₦${(amount || 0).toLocaleString()} NGN`;

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            DELIVERED
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            SHIPPED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400">
            PROCESSING
          </span>
        );
      case 'PAYMENT_CONFIRMED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            PAID · CONFIRMED
          </span>
        );
      case 'PENDING_PAYMENT':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            PENDING PAYMENT
          </span>
        );
      case 'CANCELLED':
      case 'REFUNDED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 border border-red-500/30 text-red-400">
            {status}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#CCD2D9]/10 text-[#CCD2D9]">
            {status}
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            SUCCESS
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 border border-purple-500/30 text-purple-400">
            REFUNDED
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 border border-red-500/30 text-red-400">
            FAILED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            {status}
          </span>
        );
    }
  };

  return (
    <ManagementLayout
      activeRoute="/management/orders"
      requiredPermission="ORDERS_VIEW"
      title="Orders &amp; Fulfillment Operations Desk"
      subtitle="Comprehensive cross-ecosystem tracking of order references, payments, logistics dispatch, and refunds."
      actions={
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#CCD2D9] hover:text-white bg-[#011B33] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Orders ({total})
        </button>
      }
    >
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/10 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#CCD2D9]/60" />
          <input
            type="text"
            placeholder="Search by order ref or customer email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9]"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#CCD2D9]/70">Fulfillment:</span>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
            >
              <option value="ALL">All Stages</option>
              <option value="PENDING_PAYMENT">PENDING PAYMENT</option>
              <option value="PAYMENT_CONFIRMED">PAYMENT CONFIRMED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#CCD2D9]/70">Payment:</span>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
            >
              <option value="ALL">All Payments</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="PENDING">PENDING</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-[#011B33] border border-[#0682F4]/30 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#CCD2D9]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#08E6F9]" />
            Loading order fulfillment records...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#CCD2D9]/60">
            No commerce orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#01213D] border-b border-[#0682F4]/20 text-[#CCD2D9] font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-3">Order Ref &amp; Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Fulfillment Status</th>
                  <th className="px-4 py-3 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0682F4]/10 text-white">
                {orders.map((o) => (
                  <tr key={o.orderId} className="hover:bg-[#01213D]/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-[#08E6F9] font-mono text-xs">{o.orderReference}</div>
                      <div className="text-[10px] text-[#CCD2D9]/50 font-mono mt-0.5">
                        {new Date(o.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-[11px] text-white">{o.customerEmail}</div>
                      <div className="text-[10px] text-[#CCD2D9]/50 font-mono">
                        {o.items?.length || 0} item(s) · {o.deliveryInfo?.state || 'Direct Delivery'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-xs">{formatNaira(o.total)}</div>
                      <div className="text-[10px] text-[#CCD2D9]/50 font-mono">
                        Provider: {o.paymentProvider}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">{getPaymentStatusBadge(o.paymentStatus)}</td>
                    <td className="px-4 py-3.5">{getOrderStatusBadge(o.orderStatus)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectingOrder(o)}
                          className="p-1 rounded-lg bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#CCD2D9] hover:text-white transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedOrderForStatus(o);
                            setNewOrderStatus(o.orderStatus);
                            setStatusNotes('');
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#01213D] hover:bg-[#0682F4]/20 border border-[#0682F4]/30 text-[#08E6F9] transition cursor-pointer"
                        >
                          Status
                        </button>

                        {o.paymentStatus === 'SUCCESS' && o.orderStatus !== 'REFUNDED' && (
                          <button
                            onClick={() => {
                              setSelectedOrderForRefund(o);
                              setRefundReason('');
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition cursor-pointer"
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Order Modal */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#011B33] border border-[#0682F4]/40 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ShoppingBag className="w-4 h-4 text-[#08E6F9]" />
                Order Record: {inspectingOrder.orderReference}
              </div>
              <button
                onClick={() => setInspectingOrder(null)}
                className="text-[#CCD2D9] hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20 font-mono text-[11px]">
                <div>
                  <span className="text-[#CCD2D9]/60 block">Customer:</span>
                  <span className="text-white font-bold">{inspectingOrder.customerEmail}</span>
                </div>
                <div>
                  <span className="text-[#CCD2D9]/60 block">Payment Provider:</span>
                  <span className="text-white font-bold">{inspectingOrder.paymentProvider}</span>
                </div>
                <div>
                  <span className="text-[#CCD2D9]/60 block">Order Status:</span>
                  <span className="text-[#08E6F9] font-bold">{inspectingOrder.orderStatus}</span>
                </div>
                <div>
                  <span className="text-[#CCD2D9]/60 block">Payment Status:</span>
                  <span className="text-emerald-400 font-bold">{inspectingOrder.paymentStatus}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white block">Order Items</span>
                <div className="space-y-1.5">
                  {inspectingOrder.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#01213D] border border-[#0682F4]/10 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white text-xs">{item.productNameSnapshot || item.productId}</div>
                        <div className="text-[10px] text-[#CCD2D9]/60 font-mono">
                          Qty: {item.quantity} · Price: {formatNaira(item.unitPrice)}
                        </div>
                      </div>
                      <div className="font-bold text-[#08E6F9] font-mono">
                        {formatNaira(item.itemTotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              {inspectingOrder.deliveryInfo && (
                <div className="p-3 rounded-xl bg-[#01213D] border border-[#0682F4]/20 space-y-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#08E6F9]" />
                    Delivery Destination
                  </span>
                  <p className="text-[11px] text-[#CCD2D9] font-mono">
                    {inspectingOrder.deliveryInfo.address}
                    {inspectingOrder.deliveryInfo.city && `, ${inspectingOrder.deliveryInfo.city}`}
                    {inspectingOrder.deliveryInfo.state && `, ${inspectingOrder.deliveryInfo.state}`}
                  </p>
                </div>
              )}

              {/* Total Summary */}
              <div className="pt-2 border-t border-[#0682F4]/20 flex items-center justify-between">
                <span className="text-xs font-bold text-white">Grand Total</span>
                <span className="text-base font-black text-[#08E6F9]">{formatNaira(inspectingOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {selectedOrderForStatus && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#011B33] border border-[#0682F4]/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Truck className="w-4 h-4 text-[#08E6F9]" />
                Update Fulfillment Status
              </div>
              <button
                onClick={() => setSelectedOrderForStatus(null)}
                className="text-[#CCD2D9] hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#CCD2D9] space-y-1">
              <div>
                <span className="text-[#CCD2D9]/60">Order Ref:</span> <strong className="text-white font-mono">{selectedOrderForStatus.orderReference}</strong>
              </div>
              <div>
                <span className="text-[#CCD2D9]/60">Total:</span> <span className="text-[#08E6F9] font-bold">{formatNaira(selectedOrderForStatus.total)}</span>
              </div>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Fulfillment State</label>
                <select
                  value={newOrderStatus}
                  onChange={(e) => setNewOrderStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs focus:outline-none focus:border-[#08E6F9]"
                >
                  <option value="PENDING_PAYMENT">PENDING PAYMENT</option>
                  <option value="PAYMENT_CONFIRMED">PAYMENT CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">Fulfillment Notes / Tracking</label>
                <textarea
                  rows={3}
                  placeholder="Record carrier tracking number or dispatch update notes..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-[#0682F4]/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-[#08E6F9] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#0682F4]/20">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForStatus(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#01213D] hover:bg-[#01213D]/80 border border-[#0682F4]/20 text-[#CCD2D9] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStatus}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0682F4] hover:bg-[#05A9F7] text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {submittingStatus ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {selectedOrderForRefund && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#011B33] border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#0682F4]/20 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <RotateCcw className="w-4 h-4" />
                Process Order Refund
              </div>
              <button
                onClick={() => setSelectedOrderForRefund(null)}
                className="text-[#CCD2D9] hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-1">
              <div>
                Order Ref: <strong className="font-mono text-white">{selectedOrderForRefund.orderReference}</strong>
              </div>
              <div>
                Refund Amount: <strong className="text-white">{formatNaira(selectedOrderForRefund.total)}</strong>
              </div>
              <p className="text-[11px] text-red-300/80 pt-1">
                Refunding will mark this order as REFUNDED and log an immutable audit trail.
              </p>
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#CCD2D9] mb-1">
                  Reason for Refund <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Record mandatory operational reason for customer reimbursement..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#01213D] border border-red-500/30 text-white text-xs placeholder-[#CCD2D9]/40 focus:outline-none focus:border-red-400 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#0682F4]/20">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForRefund(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#01213D] hover:bg-[#01213D]/80 border border-[#0682F4]/20 text-[#CCD2D9] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRefund}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {submittingRefund ? 'Refunding...' : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ManagementLayout>
  );
};
