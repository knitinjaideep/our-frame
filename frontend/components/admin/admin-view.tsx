'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ShieldCheck, Users, Layout, HardDrive, Loader2, Lock } from 'lucide-react'
import { adminListUsers, adminListWorkspaces, adminGetStats } from '@/lib/platform-api'
import { useCurrentUser } from '@/hooks/use-auth'

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number | string }) {
  return (
    <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
      <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </span>
      <div>
        <p className="text-2xl font-serif text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export function AdminView() {
  const { data: user, isLoading: userLoading } = useCurrentUser()

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminGetStats as () => Promise<{ total_users: number; total_workspaces: number; active_drive_connections: number }>,
    enabled: !!user?.is_platform_admin,
  })

  const { data: workspaces, isLoading: wsLoading } = useQuery({
    queryKey: ['admin', 'workspaces'],
    queryFn: adminListWorkspaces as () => Promise<Array<{ id: number; name: string; slug: string; privacy_mode: string; onboarding_complete: boolean; created_at: string }>>,
    enabled: !!user?.is_platform_admin,
  })

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminListUsers as () => Promise<Array<{ id: number; email: string; display_name: string | null; created_at: string; is_platform_admin: boolean }>>,
    enabled: !!user?.is_platform_admin,
  })

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    )
  }

  if (!user?.is_platform_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Lock className="w-8 h-8 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Platform admin access required.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3"
        >
          <ShieldCheck className="w-5 h-5 text-primary" />
          <div>
            <h1 className="font-serif text-3xl text-foreground">Platform Admin</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Safe summaries only — no media data.</p>
          </div>
        </motion.div>

        {/* Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <StatCard icon={Users} label="Total users" value={stats.total_users} />
            <StatCard icon={Layout} label="Workspaces" value={stats.total_workspaces} />
            <StatCard icon={HardDrive} label="Active Drive connections" value={stats.active_drive_connections} />
          </motion.div>
        )}

        {/* Workspaces */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <h2 className="font-serif text-xl text-foreground">Workspaces</h2>
          {wsLoading ? (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Slug</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Privacy</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Onboarded</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {workspaces?.map((w, i) => (
                    <tr
                      key={w.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-3 text-foreground font-medium">{w.name}</td>
                      <td className="px-5 py-3 text-muted-foreground font-mono hidden sm:table-cell">{w.slug}</td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">
                          {w.privacy_mode.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        {w.onboarding_complete ? (
                          <span className="text-primary text-xs">✓ Done</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground hidden lg:table-cell">
                        {new Date(w.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>

        {/* Users */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <h2 className="font-serif text-xl text-foreground">Users</h2>
          {usersLoading ? (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Name</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Admin</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 text-foreground font-mono text-xs">{u.email}</td>
                      <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{u.display_name ?? '—'}</td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        {u.is_platform_admin ? (
                          <span className="text-primary text-xs font-medium">Admin</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">User</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground hidden lg:table-cell">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  )
}
