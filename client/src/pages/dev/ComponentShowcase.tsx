import React, { useState } from 'react';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card.js';
import { Modal } from '../../components/ui/Modal.js';
import { Drawer } from '../../components/ui/Drawer.js';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '../../components/ui/Table.js';
import { Badge } from '../../components/ui/Badge.js';
import { Tooltip } from '../../components/ui/Tooltip.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs.js';
import { Dropdown, DropdownItem } from '../../components/ui/Dropdown.js';
import { CommandPalette } from '../../components/ui/CommandPalette.js';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs.js';
import { ThemeToggle } from '../../components/ui/ThemeToggle.js';
import { PageTransition } from '../../components/framer/MotionWrappers.js';
import { NumberCounter } from '../../components/framer/NumberCounter.js';
import { RefreshCw, Layers, Sliders, ShieldCheck } from 'lucide-react';


export const ComponentShowcase: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);

  const mockTableData = [
    { id: 'PP-101', student: 'John Doe', department: 'Computer Science', gpa: 9.2, status: 'Selected' },
    { id: 'PP-102', student: 'Jane Smith', department: 'Information Technology', gpa: 8.8, status: 'Shortlisted' },
    { id: 'PP-103', student: 'Robert Johnson', department: 'Mechanical Eng.', gpa: 7.5, status: 'Applied' },
    { id: 'PP-104', student: 'Emily Davis', department: 'Electronics & Comm.', gpa: 8.1, status: 'Rejected' },
  ];

  const sortedData = [...mockTableData].sort((a, b) => 
    sortAsc ? a.gpa - b.gpa : b.gpa - a.gpa
  );

  const breadcrumbsItems = [
    { label: 'Admin Panel', href: '/dashboard/admin' },
    { label: 'Developer', href: '#' },
    { label: 'UI Toolkit', href: '#' },
  ];

  const handleLoadingDemo = () => {
    setLoadingDemo(true);
    setTimeout(() => setLoadingDemo(false), 2000);
  };

  return (
    <PageTransition className="min-h-screen bg-background text-foreground transition-colors duration-300 p-6 md:p-12 space-y-12">
      {/* Command Palette hook listener */}
      <CommandPalette />

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/40 pb-8">
        <div className="space-y-1.5">
          <Breadcrumbs items={breadcrumbsItems} />
          <h1 className="text-4xl font-extrabold font-sans tracking-tight text-zinc-100 mt-2 flex items-center gap-3">
            <Layers className="w-9 h-9 text-purple-500" />
            PlacePilot Primitive Showcase
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl">
            Clean sandbox room testing all custom SaaS elements, states, Framer Motion, and design layouts. Press <kbd className="bg-zinc-950 px-1.5 py-0.5 rounded text-[10px] border border-zinc-800 text-zinc-400 font-mono">Ctrl+K</kbd> to open Command Palette.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-900/60 p-2 rounded-2xl border border-border/30 backdrop-blur-md">
          <span className="text-xs text-zinc-400 font-semibold px-2">Theme Switcher</span>
          <ThemeToggle />
        </div>
      </div>

      {/* Grid wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: UI Primitives (8 columns) */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Card: Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                Button Components & Loading States
              </CardTitle>
              <CardDescription>Comprehensive styles showing outline, loading, and sizes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="default">Primary CTA</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Border</Button>
                <Button variant="ghost">Ghost Trigger</Button>
                <Button variant="destructive">Destructive Action</Button>
              </div>
              <div className="flex flex-wrap gap-4 items-center border-t border-border/40 pt-6">
                <Button variant="default" size="sm">Small</Button>
                <Button variant="default" size="md">Medium</Button>
                <Button variant="default" size="lg">Large</Button>
                <Button variant="default" size="icon" className="w-11 h-11"><ShieldCheck className="w-5 h-5" /></Button>
              </div>
              <div className="flex flex-wrap gap-4 items-center border-t border-border/40 pt-6">
                <Button variant="default" loading={loadingDemo} onClick={handleLoadingDemo}>
                  {loadingDemo ? 'Processing' : 'Click to Trigger Loading'}
                </Button>
                <Button variant="outline" loading>Please Wait</Button>
                <Button variant="destructive" loading>Removing File</Button>
              </div>
            </CardContent>
          </Card>

          {/* Card: Badge & Tooltips */}
          <Card>
            <CardHeader>
              <CardTitle>Badge Indicators & Tooltips</CardTitle>
              <CardDescription>Visual status flags and micro helper tooltips on hover.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="success">Success / Selected</Badge>
                <Badge variant="warning">Warning / Action</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="info">Info / Mapped</Badge>
                <Badge variant="outline">Outline Badge</Badge>
              </div>
              <div className="flex flex-wrap gap-6 items-center border-t border-border/40 pt-6">
                <Tooltip content="Tooltip showing helpful extra context" side="top">
                  <Button variant="outline" size="sm">Hover Me (Top)</Button>
                </Tooltip>
                <Tooltip content="Bottom alignment tooltip description" side="bottom">
                  <Button variant="outline" size="sm">Hover Me (Bottom)</Button>
                </Tooltip>
                <Tooltip content="Aligned right trigger helper text" side="right">
                  <Button variant="outline" size="sm">Hover Me (Right)</Button>
                </Tooltip>
              </div>
            </CardContent>
          </Card>

          {/* Card: Tabs & Dropdowns */}
          <Card>
            <CardHeader>
              <CardTitle>Tabs & Custom Dropdown Menus</CardTitle>
              <CardDescription>Context-controlled navigation layers with animations.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview Details</TabsTrigger>
                  <TabsTrigger value="academic">Academic Criteria</TabsTrigger>
                  <TabsTrigger value="skills">Developer Skills</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="bg-zinc-950/20 border border-border/40 p-6 rounded-2xl mt-4">
                  <h4 className="font-bold text-sm text-zinc-200">Main Platform Settings</h4>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    This content area switches dynamically. Everything conforms to Vercel/Linear dark aesthetics.
                  </p>
                </TabsContent>
                <TabsContent value="academic" className="bg-zinc-950/20 border border-border/40 p-6 rounded-2xl mt-4">
                  <h4 className="font-bold text-sm text-zinc-200">Academic Scoreboards</h4>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    Default thresholds: Minimum CGPA: 8.0, Maximum pending backlogs: 0. Eligible branches: CSE, IT, ECE.
                  </p>
                </TabsContent>
                <TabsContent value="skills" className="bg-zinc-950/20 border border-border/40 p-6 rounded-2xl mt-4">
                  <h4 className="font-bold text-sm text-zinc-200">Skills Keywords Mapped</h4>
                  <div className="flex gap-2 flex-wrap mt-3">
                    <Badge variant="outline">React</Badge>
                    <Badge variant="outline">TypeScript</Badge>
                    <Badge variant="outline">NodeJS</Badge>
                    <Badge variant="outline">MongoDB</Badge>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="border-t border-border/40 pt-6 mt-8 flex justify-between items-center">
                <span className="text-xs text-zinc-400 font-semibold">Custom drop-down trigger overlay:</span>
                <Dropdown
                  trigger={<Button variant="outline">Open Options Dropdown</Button>}
                >
                  <DropdownItem onClick={() => alert('Editing item')}>Edit Profile</DropdownItem>
                  <DropdownItem onClick={() => alert('Duplicating item')}>Duplicate Drive</DropdownItem>
                  <DropdownItem disabled>Export Options (Disabled)</DropdownItem>
                  <hr className="border-border/30 my-1" />
                  <DropdownItem className="text-red-400 hover:bg-red-500/10" onClick={() => alert('Deleting')}>Delete Record</DropdownItem>
                </Dropdown>
              </div>
            </CardContent>
          </Card>

          {/* Card: Table */}
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Sortable Placement Candidates</CardTitle>
                <CardDescription>Responsive table primitives featuring customizable headers and cells.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSortAsc(!sortAsc)}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Sort GPA {sortAsc ? 'Asc' : 'Desc'}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Academic Branch</TableHead>
                    <TableHead className="text-right">GPA Score</TableHead>
                    <TableHead className="text-right">Hiring Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">{row.id}</TableCell>
                      <TableCell className="font-bold text-zinc-200">{row.student}</TableCell>
                      <TableCell className="text-zinc-400">{row.department}</TableCell>
                      <TableCell className="text-right font-mono text-zinc-100">{row.gpa}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            row.status === 'Selected' ? 'success' :
                            row.status === 'Shortlisted' ? 'info' :
                            row.status === 'Applied' ? 'warning' : 'destructive'
                          }
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Interaction, Modals, Stats & Skeletons (4 columns) */}
        <div className="lg:col-span-4 space-y-12">
          
          {/* Card: Animated Stats & Overlay Triggers */}
          <Card>
            <CardHeader>
              <CardTitle>Overlays & Animated Numbers</CardTitle>
              <CardDescription>Framer-motion triggered stats and dialog triggers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stat Counters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950/40 p-4 border border-border/40 rounded-2xl">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Placement Rate</p>
                  <p className="text-2xl font-bold font-mono text-purple-400 mt-1">
                    <NumberCounter value={94} suffix="%" />
                  </p>
                </div>
                <div className="bg-zinc-950/40 p-4 border border-border/40 rounded-2xl">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Average package</p>
                  <p className="text-2xl font-bold font-mono text-emerald-450 mt-1">
                    <NumberCounter value={12.5} decimals={1} suffix=" LPA" />
                  </p>
                </div>
              </div>

              {/* Modals & Drawers Toggles */}
              <div className="flex flex-col gap-3 pt-2">
                <Button variant="default" className="w-full" onClick={() => setModalOpen(true)}>
                  Launch Scale-In Modal
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setDrawerOpen(true)}>
                  Slide Out Right Drawer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card: Skeletons & Loaders */}
          <Card>
            <CardHeader>
              <CardTitle>Skeletons Preload Indicators</CardTitle>
              <CardDescription>Polished pulse frames representing async database items.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3 bg-zinc-950/20 p-4 border border-border/30 rounded-2xl">
                <Skeleton variant="avatar" />
                <div className="space-y-2 flex-1">
                  <Skeleton variant="text" className="w-3/4" />
                  <Skeleton variant="text" className="w-1/2" />
                </div>
              </div>
              
              {/* Card Skeleton Demo */}
              <div className="bg-zinc-950/20 p-4 border border-border/30 rounded-2xl space-y-4">
                <Skeleton variant="text" className="w-1/3 h-5" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Section: Feedback States Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-border/40 pt-12">
        <EmptyState
          title="Candidate Applications Pipeline Empty"
          description="There are currently no active student applications registered for this placement drive cohort cycle."
          actionLabel="Configure Cutoff Scores"
          onAction={() => alert('Rerouting to settings')}
        />
        <ErrorState
          title="Database sync timed out"
          message="Unable to complete retrieval query from master Cloudinary buckets. Verify connection credentials."
          onRetry={() => alert('Retrying connection...')}
        />
      </div>

      {/* Modal component rendered conditionally */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Candidate Shortlist Parameters Configuration"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="default" size="sm" onClick={() => { setModalOpen(false); alert('Settings Saved!'); }}>Save Changes</Button>
          </>
        }
      >
        <p className="leading-relaxed">
          Configure CGPA and backlog thresholds below to automatically filter applicants. Registered placement officers can overwrite individual profiles when required.
        </p>
        <div className="mt-4 p-4 bg-zinc-950/60 border border-zinc-850 rounded-2xl space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400 font-bold uppercase tracking-wider">Cutoff score (CGPA):</span>
            <span className="text-zinc-100 font-mono font-bold">8.5 / 10.0</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400 font-bold uppercase tracking-wider">Maximum backlogs allowed:</span>
            <span className="text-zinc-100 font-mono font-bold">0</span>
          </div>
        </div>
      </Modal>

      {/* Drawer component rendered conditionally */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="System Audit Information Log"
        footer={
          <Button variant="default" className="w-full" size="sm" onClick={() => setDrawerOpen(false)}>Close Drawer</Button>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">
            Audit logging trace details for placement updates:
          </p>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl flex flex-col gap-1">
                <span className="text-xs font-bold text-zinc-200">PRIVILEGE_MODIFICATION</span>
                <span className="text-[10px] text-zinc-500 font-mono">User ID: PP-USR-09 • IP: 192.168.1.42</span>
              </div>
            ))}
          </div>
        </div>
      </Drawer>

    </PageTransition>
  );
};
export default ComponentShowcase;
