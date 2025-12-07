import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { User, Key, Bell, Trash2, ExternalLink } from 'lucide-react';

export default function Settings() {
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
                <p className="text-sm text-muted-foreground">Manage your account details</p>
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <label className="text-sm font-medium text-foreground">Display Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full mt-1.5 h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full mt-1.5 h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button>Save Changes</Button>
            </div>
          </section>

          {/* API Keys Section */}
          <section className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-accent-foreground">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-foreground">API Keys</h2>
                <p className="text-sm text-muted-foreground">Configure your API integrations</p>
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="p-4 rounded-lg bg-accent/50">
                <p className="text-sm text-foreground mb-3">
                  Connect to <strong>Lovable Cloud</strong> to enable AI processing, transcription, and more.
                </p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Enable Lovable Cloud
                </Button>
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-accent-foreground">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-foreground">Notifications</h2>
                <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-border">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-foreground">Email notifications</span>
                <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-foreground">Processing complete alerts</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
              </label>
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
