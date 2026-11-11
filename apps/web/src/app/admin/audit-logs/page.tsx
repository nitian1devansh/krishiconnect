'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, ShieldAlert } from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AdminAuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    ApiClient.get('/admin/audit-logs')
      .then((res) => {
        if (res.success && res.data) {
          setLogs(res.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div>
        <Link href="/admin/dashboard" className="text-xs text-forest-600 hover:text-forest-900 flex items-center space-x-1 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Admin Control Center</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-forest-950">Administrative Audit Trails</h1>
        <p className="text-xs text-forest-600">Immutable chronological records of sensitive moderator decisions, approvals, and payout transitions.</p>
      </div>

      <div className="bg-white rounded-4xl border border-forest-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f9fbf5] border-b border-forest-200 text-forest-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Target Entity</th>
                <th className="px-6 py-4">Audited By</th>
                <th className="px-6 py-4">Audit Details</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-50 text-forest-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-forest-50/50">
                  <td className="px-6 py-4 font-mono font-bold text-forest-950">
                    <span className="px-2 py-0.5 rounded bg-forest-100 text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold">{log.targetType}</span>
                    <span className="text-[10px] text-forest-400 block font-mono">#{log.targetId.slice(-8)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold">{log.admin?.fullName || 'System Administrator'}</span>
                    <span className="text-[10px] text-forest-500 block">{log.admin?.email || 'admin@krishiconnect.in'}</span>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-forest-600">
                    {log.details || 'Action completed successfully.'}
                  </td>
                  <td className="px-6 py-4 text-forest-500 text-[11px]">
                    {new Date(log.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

