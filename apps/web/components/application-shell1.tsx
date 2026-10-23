"use client"

import {
  BadgeCheck,
  BarChart3,
  Briefcase,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  Clock3,
  FileText,
  Folder,
  Globe2,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  Star,
  User,
  Users,
} from "lucide-react"
import { MotionConfig, motion } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { cn } from "cn"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Separator } from "@workspace/ui/components/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { authClient } from "@/lib/auth-client"
import { siteConfig } from "@/lib/site"

// Base nav item - used by simple sidebars
type NavItem = {
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  href: string
  isActive?: boolean
  // Optional children for submenus (Sidebar3+)
  children?: NavItem[]
}

// Nav group with optional collapsible state
type NavGroup = {
  title: string
  items: NavItem[]
  // Optional: default collapsed state (Sidebar2+)
  defaultOpen?: boolean
}

// User data for footer (Sidebar6+)
type UserData = {
  name: string
  email: string
  image?: string | null
}

// Complete sidebar data structure
type SidebarData = {
  // Logo/branding (all sidebars)
  logo: {
    src: string
    alt: string
    title: string
    description: string
  }
  // Main navigation groups (all sidebars)
  navGroups: NavGroup[]
  // Footer navigation group (all sidebars)
  footerGroup: NavGroup
  // Workspaces for switcher (Sidebar7+)
  workspaces?: Array<{
    id: string
    name: string
    logo: string
    plan: string
  }>
  // Currently active workspace (Sidebar7+)
  activeWorkspace?: string
}

// Shared sidebar data - works with all sidebar variations
const sidebarData: SidebarData = {
  logo: {
    src: siteConfig.logo.src,
    alt: siteConfig.logo.alt,
    title: siteConfig.name,
    description: "Workspace",
  },
  navGroups: [
    {
      title: "Overview",
      defaultOpen: true,
      items: [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/dashboard",
          isActive: true,
        },
        { label: "Tasks", icon: ClipboardList, href: "#" },
        { label: "Roadmap", icon: BarChart3, href: "#" },
      ],
    },
    {
      title: "Projects",
      defaultOpen: true,
      items: [
        {
          label: "Active Projects",
          icon: Briefcase,
          href: "#",
          children: [
            { label: "Project Alpha", icon: FileText, href: "#" },
            { label: "Project Beta", icon: FileText, href: "#" },
            { label: "Project Gamma", icon: FileText, href: "#" },
          ],
        },
        {
          label: "Archived",
          icon: Folder,
          href: "#",
          children: [
            { label: "2024 Archive", icon: FileText, href: "#" },
            { label: "2023 Archive", icon: FileText, href: "#" },
          ],
        },
      ],
    },
    {
      title: "Team",
      defaultOpen: false,
      items: [
        { label: "Members", icon: Users, href: "#" },
        { label: "Sprints", icon: Clock3, href: "#" },
        { label: "Approvals", icon: BadgeCheck, href: "#" },
        { label: "Reviews", icon: Star, href: "#" },
      ],
    },
    {
      title: "Workspace",
      defaultOpen: false,
      items: [
        { label: "Integrations", icon: Globe2, href: "#" },
        { label: "Automations", icon: Sparkles, href: "#" },
      ],
    },
  ],
  footerGroup: {
    title: "Support",
    items: [
      { label: "Help Center", icon: HelpCircle, href: "#" },
      { label: "Settings", icon: Settings, href: "#" },
    ],
  },
  workspaces: [
    {
      id: "1",
      name: "Shadcnblocks",
      logo: "https://cdn.shadcnblocks.com/shadcnblocks/block/logos/shadcnblocks-logo.svg",
      plan: "Enterprise",
    },
    {
      id: "2",
      name: "Shadcn Templates",
      logo: "https://cdn.shadcnblocks.com/shadcnblocks/block/logos/shadcnblocks-logo.svg",
      plan: "Startup",
    },
    {
      id: "3",
      name: "Shadcn Components",
      logo: "https://cdn.shadcnblocks.com/shadcnblocks/block/logos/shadcnblocks-logo.svg",
      plan: "Free",
    },
  ],
  activeWorkspace: "1",
}

const spring = { type: "spring", bounce: 0.18, duration: 0.45 } as const

// Shared motion classes for menu buttons: press feedback and the active pill
// rendered by ActivePill instead of the static background.
const buttonMotion =
  "relative isolate overflow-visible transition-[width,height,padding,background-color,color,transform] duration-200 ease-out group-data-[collapsible=icon]:overflow-hidden active:scale-[0.98] data-active:bg-transparent data-active:hover:bg-sidebar-accent/60 motion-reduce:transition-none motion-reduce:active:scale-100"

const ActivePill = () => (
  <motion.span
    layoutId="sidebar-active-pill"
    transition={spring}
    className="absolute inset-0 -z-10 rounded-md bg-sidebar-accent shadow-xs ring-1 ring-sidebar-border/60"
  />
)

const SidebarLogo = ({ logo }: { logo: SidebarData["logo"] }) => {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" render={<Link href="/" />}>
          <img src={logo.src} alt={logo.alt} className="size-8 dark:invert" />
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-medium">{logo.title}</span>
            <span className="text-xs text-muted-foreground">
              {logo.description}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

const NavMenuItem = ({
  item,
  active,
  onNavigate,
}: {
  item: NavItem
  active: string
  onNavigate: (label: string) => void
}) => {
  const Icon = item.icon
  const hasChildren = item.children && item.children.length > 0

  if (!hasChildren) {
    const isActive = active === item.label
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive}
          className={buttonMotion}
          render={
            <a
              href={item.href}
              onClick={(event) => {
                event.preventDefault()
                onNavigate(item.label)
              }}
            />
          }
        >
          {isActive && <ActivePill />}
          <Icon className="size-4" />
          <span>{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <Collapsible
      defaultOpen
      className="group/collapsible"
      render={<SidebarMenuItem />}
    >
      <CollapsibleTrigger
        render={<SidebarMenuButton className={buttonMotion} />}
      >
        <Icon className="size-4" />
        <span>{item.label}</span>
        <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-data-open/collapsible:rotate-90 motion-reduce:transition-none" />
      </CollapsibleTrigger>
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none">
        <SidebarMenuSub>
          {item.children!.map((child, index) => {
            const isActive = active === child.label
            return (
              <SidebarMenuSubItem
                key={child.label}
                className="animate-in duration-300 fade-in-0 fill-mode-both slide-in-from-left-2 motion-reduce:animate-none"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <SidebarMenuSubButton
                  isActive={isActive}
                  className={buttonMotion}
                  render={
                    <a
                      href={child.href}
                      onClick={(event) => {
                        event.preventDefault()
                        onNavigate(child.label)
                      }}
                    />
                  }
                >
                  {isActive && <ActivePill />}
                  <span>{child.label}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            )
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}

const NavUser = ({ user }: { user: UserData }) => {
  const router = useRouter()
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="transition-[width,height,padding,background-color,transform] duration-200 ease-out active:scale-[0.98] motion-reduce:transition-none data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-lg duration-200"
            side="bottom"
            align="end"
            sideOffset={6}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage
                      src={user.image ?? undefined}
                      alt={user.name}
                    />
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 size-4" />
              Account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                const { error } = await authClient.signOut()
                if (error) return
                router.push("/")
                router.refresh()
              }}
            >
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

const AppSidebar = ({
  active,
  onNavigate,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  active: string
  onNavigate: (label: string) => void
  user: UserData
}) => {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarLogo logo={sidebarData.logo} />
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <ScrollArea className="min-h-0 flex-1">
          {sidebarData.navGroups.map((group, groupIndex) => (
            <SidebarGroup
              key={group.title}
              className="animate-in duration-500 fade-in-0 fill-mode-both slide-in-from-left-2 motion-reduce:animate-none"
              style={{ animationDelay: `${groupIndex * 60}ms` }}
            >
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <NavMenuItem
                      key={item.label}
                      item={item}
                      active={active}
                      onNavigate={onNavigate}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

// Find the group (and parent item) of the active page for the breadcrumb
const findTrail = (label: string) => {
  for (const group of sidebarData.navGroups) {
    for (const item of group.items) {
      if (item.label === label) return [group.title, item.label]
      const child = item.children?.find((entry) => entry.label === label)
      if (child) return [group.title, item.label, child.label]
    }
  }
  return [label]
}

const initialActive =
  sidebarData.navGroups
    .flatMap((group) => group.items)
    .find((item) => item.isActive)?.label ?? "Dashboard"

interface ApplicationShell1Props {
  user: UserData
  children?: React.ReactNode
  className?: string
}

export function ApplicationShell1({
  user,
  children,
  className,
}: ApplicationShell1Props) {
  const [active, setActive] = React.useState(initialActive)
  const trail = findTrail(active)

  return (
    <MotionConfig reducedMotion="user">
      <SidebarProvider className={cn(className)}>
        <AppSidebar active={active} onNavigate={setActive} user={user} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-2 hidden md:block"
            />
            <Link href="/" className="flex items-center gap-2 md:hidden">
              <img
                src={sidebarData.logo.src}
                alt={sidebarData.logo.alt}
                className="size-8 dark:invert"
              />
              <span className="font-semibold">{sidebarData.logo.title}</span>
            </Link>
            <Breadcrumb className="hidden md:block">
              <BreadcrumbList>
                {trail.map((crumb, index) => {
                  const isLast = index === trail.length - 1
                  return (
                    <React.Fragment key={`${crumb}-${index}`}>
                      {index > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem
                        key={isLast ? active : crumb}
                        className="animate-in duration-300 fade-in-0 fill-mode-both slide-in-from-bottom-1 motion-reduce:animate-none"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {isLast ? (
                          <BreadcrumbPage>{crumb}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href="#">{crumb}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div
              key={active}
              className="flex-1 animate-in duration-500 ease-out fade-in-0 fill-mode-both slide-in-from-bottom-2 zoom-in-[0.99] motion-reduce:animate-none"
            >
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </MotionConfig>
  )
}
