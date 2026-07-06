"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type ComboboxOption = {
  value: string
  label: string
}

interface SearchableComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  onCreate?: (inputValue: string) => Promise<void>
  placeholder?: string
  emptyText?: string
  disabled?: boolean
}

export function SearchableCombobox({
  options,
  value,
  onChange,
  onCreate,
  placeholder = "Select option...",
  emptyText = "No option found.",
  disabled = false,
}: SearchableComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)

  const handleCreate = async () => {
    if (!onCreate || !inputValue) return
    
    setIsCreating(true)
    try {
      await onCreate(inputValue)
      setInputValue("")
      setOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setIsCreating(false)
    }
  }

  // Exact match prevents "Create XYZ" from showing if it already exists
  const exactMatch = options.find((opt) => opt.label.toLowerCase() === inputValue.toLowerCase())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[300px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={`Search ${placeholder.toLowerCase()}...`} 
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty className="py-2 px-2 text-sm">
              {emptyText}
              {onCreate && inputValue && !exactMatch && (
                <Button 
                  variant="ghost" 
                  className="w-full mt-2 justify-start font-normal text-primary"
                  onClick={handleCreate}
                  disabled={isCreating}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isCreating ? "Creating..." : `Create "${inputValue}"`}
                </Button>
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {/* Show create button even if there are partial matches, but no exact match */}
            {onCreate && inputValue && !exactMatch && options.length > 0 && (
              <CommandGroup>
                <CommandItem
                  value={`create-${inputValue}`}
                  onSelect={handleCreate}
                  className="text-primary font-medium cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isCreating ? "Creating..." : `Create "${inputValue}"`}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
