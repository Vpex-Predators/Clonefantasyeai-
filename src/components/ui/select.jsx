"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"

import { cn } from "@/lib/utils"

const MobileSelectContext = React.createContext(null)

const DesktopSelectGroup = SelectPrimitive.Group

const DesktopSelectValue = SelectPrimitive.Value

const DesktopSelectTrigger = React.forwardRef(/** @param {any} props */ ({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}>
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
DesktopSelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const DesktopSelectScrollUpButton = React.forwardRef(/** @param {any} props */ ({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}>
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
DesktopSelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const DesktopSelectScrollDownButton = React.forwardRef(/** @param {any} props */ ({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}>
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
DesktopSelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const DesktopSelectContent = React.forwardRef(/** @param {any} props */ ({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}>
      <DesktopSelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn("p-1", position === "popper" &&
          "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}>
        {children}
      </SelectPrimitive.Viewport>
      <DesktopSelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
DesktopSelectContent.displayName = SelectPrimitive.Content.displayName

const DesktopSelectLabel = React.forwardRef(/** @param {any} props */ ({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props} />
))
DesktopSelectLabel.displayName = SelectPrimitive.Label.displayName

const DesktopSelectItem = React.forwardRef(/** @param {any} props */ ({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}>
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
DesktopSelectItem.displayName = SelectPrimitive.Item.displayName

const DesktopSelectSeparator = React.forwardRef(/** @param {any} props */ ({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props} />
))
DesktopSelectSeparator.displayName = SelectPrimitive.Separator.displayName


function collectOptions(children, options = []) {
  React.Children.forEach(children, child => {
    if (!React.isValidElement(child)) return
    if (child.type === SelectItem) options.push(child.props)
    else if (child.props.children) collectOptions(child.props.children, options)
  })
  return options
}

/** @param {any} props */
function Select({ children, value, defaultValue, onValueChange, open, defaultOpen,
  onOpenChange, disabled, name, required, form, ...props }) {
  const mobile = useIsMobile()
  const [localValue, setLocalValue] = React.useState(defaultValue ?? "")
  const [localOpen, setLocalOpen] = React.useState(defaultOpen ?? false)
  const selected = value !== undefined ? value : localValue
  const expanded = open !== undefined ? open : localOpen
  const setOpen = next => {
    setLocalOpen(next)
    onOpenChange?.(next)
  }
  const options = collectOptions(children)
  const choose = next => {
    if (next !== selected) {
      setLocalValue(next)
      onValueChange?.(next)
    }
    setOpen(false)
  }
  // Use one value/open state across responsive mode changes.
  if (!mobile) return <SelectPrimitive.Root {...props} value={selected} onValueChange={choose}
    open={expanded} onOpenChange={setOpen} disabled={disabled} name={name} required={required} form={form}>
    {children}
  </SelectPrimitive.Root>
  return <MobileSelectContext.Provider value={{ selected, expanded, setOpen, choose, disabled, options }}>
    <Drawer open={expanded} onOpenChange={setOpen} shouldScaleBackground={false}>
      {children}
    </Drawer>
    {name && <select className="sr-only" tabIndex={-1} aria-hidden="true" name={name}
      form={form} required={required} disabled={disabled} value={selected}
      onChange={event => choose(event.target.value)}>
      <option value="" />
      {options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>
        {option.textValue || option.children}
      </option>)}
    </select>}
  </MobileSelectContext.Provider>
}

const SelectTrigger = React.forwardRef(/** @param {any} props */ ({ className, children, onClick, ...props }, ref) => {
  const mobile = React.useContext(MobileSelectContext)
  if (!mobile) return <DesktopSelectTrigger ref={ref} className={className} onClick={onClick} {...props}>{children}</DesktopSelectTrigger>
  return <DrawerTrigger asChild>
    <button ref={ref} type="button" disabled={mobile.disabled} aria-haspopup="dialog"
      aria-expanded={mobile.expanded} data-placeholder={mobile.selected ? undefined : ""}
      className={cn("flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className)}
      onClick={onClick} {...props}>
      {children}<ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
    </button>
  </DrawerTrigger>
})
SelectTrigger.displayName = "SelectTrigger"

/** @param {any} props */
function SelectValue({ placeholder, children, ...props }) {
  const mobile = React.useContext(MobileSelectContext)
  if (!mobile) return <DesktopSelectValue placeholder={placeholder} {...props}>{children}</DesktopSelectValue>
  const option = mobile.options.find(item => item.value === mobile.selected)
  return <span {...props}>{children ?? (option ? option.children : placeholder)}</span>
}

const SelectContent = React.forwardRef(/** @param {any} props */ ({ className, children, position, ...props }, ref) => {
  const mobile = React.useContext(MobileSelectContext)
  const list = React.useRef(null)
  if (!mobile) return <DesktopSelectContent ref={ref} className={className} position={position} {...props}>{children}</DesktopSelectContent>
  const onKeyDown = event => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return
    const items = [...list.current.querySelectorAll('[role="option"]:not(:disabled)')]
    if (!items.length) return
    event.preventDefault()
    const index = items.indexOf(document.activeElement)
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
      : event.key === "ArrowDown" ? (index + 1) % items.length : (index - 1 + items.length) % items.length
    items[next].focus()
  }
  return <DrawerContent {...props} ref={ref} aria-describedby={undefined}
    className={cn("max-h-[85vh] supports-[height:100dvh]:max-h-[85dvh] bg-popover text-popover-foreground", className)}
    onOpenAutoFocus={event => {
      props.onOpenAutoFocus?.(event)
      if (event.defaultPrevented) return
      event.preventDefault()
      const items = [...list.current.querySelectorAll('[role="option"]:not(:disabled)')]
      ;(items.find(item => item.getAttribute('aria-selected') === 'true') || items[0])?.focus()
    }}>
    <DrawerTitle className="px-4 py-3 text-sm">Choose an option</DrawerTitle>
    <div ref={list} role="listbox" aria-label="Options" onKeyDown={onKeyDown}
      className="overflow-y-auto overscroll-contain px-2 pb-[calc(1rem+env(safe-area-inset-bottom))]" data-vaul-no-drag>
      {children}
    </div>
  </DrawerContent>
})
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef(/** @param {any} props */ ({ children, className, value, disabled, textValue, onClick, ...props }, ref) => {
  const mobile = React.useContext(MobileSelectContext)
  if (!mobile) return <DesktopSelectItem ref={ref} className={className} value={value} disabled={disabled} textValue={textValue} onClick={onClick} {...props}>{children}</DesktopSelectItem>
  const selected = mobile.selected === value
  return <button ref={ref} type="button" role="option" aria-selected={selected}
    disabled={disabled || mobile.disabled} data-disabled={disabled ? "" : undefined}
    className={cn("relative flex min-h-11 w-full items-center rounded-sm py-2.5 pl-3 pr-9 text-left text-sm outline-none focus:bg-accent focus:text-accent-foreground disabled:opacity-50", className)}
    {...props} onClick={event => { onClick?.(event); if (!event.defaultPrevented) mobile.choose(value) }}>
    {children}{selected && <Check className="absolute right-3 h-4 w-4" aria-hidden="true" />}
  </button>
})
SelectItem.displayName = "SelectItem"

const SelectGroup = React.forwardRef((props, ref) => React.useContext(MobileSelectContext)
  ? <div ref={ref} role="group" {...props} /> : <DesktopSelectGroup ref={ref} {...props} />)
SelectGroup.displayName = "SelectGroup"
const SelectLabel = React.forwardRef((props, ref) => React.useContext(MobileSelectContext)
  ? <div ref={ref} {...props} className={cn("px-3 py-2 text-sm font-semibold", props.className)} /> : <DesktopSelectLabel ref={ref} {...props} />)
SelectLabel.displayName = "SelectLabel"
const SelectSeparator = React.forwardRef((props, ref) => React.useContext(MobileSelectContext)
  ? <div ref={ref} role="separator" {...props} className={cn("my-1 h-px bg-muted", props.className)} /> : <DesktopSelectSeparator ref={ref} {...props} />)
SelectSeparator.displayName = "SelectSeparator"
function SelectScrollUpButton(props) { return React.useContext(MobileSelectContext) ? null : <DesktopSelectScrollUpButton {...props} /> }
function SelectScrollDownButton(props) { return React.useContext(MobileSelectContext) ? null : <DesktopSelectScrollDownButton {...props} /> }

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel,
  SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton }
