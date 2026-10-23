"use client"

import * as React from "react"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { useConsent } from "@/components/consent/consent-provider"
import type { ConsentCategory } from "@/lib/consent"

const categories: {
  id: ConsentCategory | "necessary"
  title: string
  description: string
}[] = [
  {
    id: "necessary",
    title: "Strictly necessary",
    description:
      "Required for sign-in, security, and remembering your cookie choice. Always on.",
  },
  {
    id: "analytics",
    title: "Analytics",
    description:
      "Google Analytics and Google Tag Manager help us understand how the site is used.",
  },
  {
    id: "marketing",
    title: "Marketing",
    description:
      "Meta Pixel measures ad performance and builds audiences for advertising.",
  },
]

export function CookiePreferences({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { consent, save } = useConsent()
  const [choices, setChoices] = React.useState({
    analytics: false,
    marketing: false,
  })

  // Start from the saved choice each time the dialog opens
  React.useEffect(() => {
    if (open) {
      setChoices({
        analytics: consent?.analytics ?? false,
        marketing: consent?.marketing ?? false,
      })
    }
  }, [open, consent])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cookie settings</DialogTitle>
          <DialogDescription>
            Choose which cookies we can use. Your choice is saved for 6 months.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col divide-y">
          {categories.map((category) => {
            const id = `consent-${category.id}`
            const isNecessary = category.id === "necessary"
            return (
              <div
                key={category.id}
                className="flex items-start justify-between gap-4 py-3"
              >
                <div className="space-y-1">
                  <Label htmlFor={id}>{category.title}</Label>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
                <Switch
                  id={id}
                  checked={
                    isNecessary || choices[category.id as ConsentCategory]
                  }
                  disabled={isNecessary}
                  onCheckedChange={(checked) =>
                    setChoices((prev) => ({
                      ...prev,
                      [category.id]: checked,
                    }))
                  }
                />
              </div>
            )
          })}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => save({ analytics: false, marketing: false })}
          >
            Reject all
          </Button>
          <Button onClick={() => save(choices)}>Save preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
