"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ArrowDown, ArrowUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

type AccordionItemVariant = "default" | "dark" | "light"

interface AccordionItemProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {
  variant?: AccordionItemVariant
}

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: "border-b",
    dark: "text-white rounded-lg mb-4 overflow-hidden",
    light: "bg-gray-100 rounded-lg mb-4 overflow-hidden"
  }

  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn(variantStyles[variant], className)}
      {...props}
    />
  )
})
AccordionItem.displayName = "AccordionItem"

interface AccordionTriggerProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {
  variant?: AccordionItemVariant
}

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, children, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: "py-4",
    dark: "px-6 py-5 bg-[rgba(44,44,44,1)] hover:bg-[rgba(34,34,34,1)]",
    light: "px-6 py-5 hover:bg-gray-200"
  }

  return (
    <AccordionPrimitive.Header className="flex" asChild>
      <div>
        <AccordionPrimitive.Trigger
          ref={ref}
          className={cn(
            "flex flex-1 items-center justify-between transition-all group text-[20px] font-normal",
            variantStyles[variant],
            className
          )}
          {...props}
        >
        {children}
        {variant === "default" ? (
          <ArrowDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        ) : (
          <>
            <ArrowUp className="h-5 w-5 shrink-0 transition-all duration-200 group-data-[state=closed]:hidden" />
            <ArrowDown className="h-5 w-5 shrink-0 transition-all duration-200 group-data-[state=open]:hidden" />
          </>
        )}
      </AccordionPrimitive.Trigger>
      </div>
    </AccordionPrimitive.Header>
  )
})
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

interface AccordionContentProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> {
  variant?: AccordionItemVariant
}

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(({ className, children, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: "pb-4 pt-0",
    dark: "p-6 bg-black",
    light: "p-6"
  }

  return (
    <AccordionPrimitive.Content
      ref={ref}
      className="overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn(variantStyles[variant], className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
})

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
