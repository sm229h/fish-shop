import { ORDER_FLOW, STATUS_LABELS, formatDateTime } from '../utils/status';

export default function OrderTimeline({ history, currentStatus }) {
  if (!history || history.length === 0) return null;

  const completedStatuses = history.map(h => h.to_status);
  const flowStatuses = ORDER_FLOW;
  const isTerminal = ['rejected', 'cancelled', 'delivered'].includes(currentStatus);

  return (
    <div className="timeline">
      {history.map((h, i) => (
        <div key={i} className={`timeline-item ${h.to_status === currentStatus ? 'current' : 'done'}`}>
          <div className="timeline-content">
            <div className="timeline-status">{STATUS_LABELS[h.to_status] || h.to_status}</div>
            <div className="timeline-time">
              {formatDateTime(h.created_at)}
              {h.first_name && ` — ${h.first_name} ${h.last_name || ''}`}
              {h.note && ` — ${h.note}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
