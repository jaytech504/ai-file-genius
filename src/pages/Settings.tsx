import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { User, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Settings() {
  const { user } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Not set';
  const email = user?.email || 'Not available';

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <header className="mb-8 animate-in">
          <h1 className="font-display font-bold text-3xl text-foreground mb-2">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account and application preferences.
          </p>
        </header>

        <div className="space-y-6">
          {/* Profile Section */}
          <section className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-foreground">Profile</h2>
                <p className="text-sm text-muted-foreground">Your account details</p>
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                <p className="mt-1.5 text-foreground">{displayName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="mt-1.5 text-foreground">{email}</p>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="card-elevated p-6 border-destructive/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-foreground">Danger Zone</h2>
                <p className="text-sm text-muted-foreground">Irreversible actions</p>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <Button variant="destructive">Delete Account</Button>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
