"use client"

import { useState, useEffect, useRef } from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import type { ProductSearchParams } from "@/lib/product-search"

const DEMO_PRODUCTS = [
  { value: "apple iphone 17 pro", label: "Apple iPhone 17 Pro" },
  { value: "apple iphone 15 pro", label: "Apple iPhone 15 Pro" },
  { value: "samsung galaxy s24 ultra", label: "Samsung Galaxy S24 Ultra" },
  { value: "google pixel 8 pro", label: "Google Pixel 8 Pro" },
  { value: "macbook pro m3", label: "MacBook Pro M3" },
  { value: "sony playstation 5", label: "Sony PlayStation 5" },
]

type ProductSearchFormProps = {
  value: ProductSearchParams
  onChange: (value: ProductSearchParams) => void
}

export function ProductSearchForm({ value, onChange }: ProductSearchFormProps) {
  const [inputValue, setInputValue] = useState(value.brandModel || value.pastedUrl || "")
  const [isOpen, setIsOpen] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredProducts = DEMO_PRODUCTS.filter((product) =>
    product.label.toLowerCase().includes(inputValue.toLowerCase())
  )

  const handleSelect = (selectedValue: string, label: string) => {
    setInputValue(label)
    setIsOpen(false)
    setShowManualInput(false)
    
    // Pass the selection up to DealSearchBar's state
    onChange({
      ...value,
      category: "electronics", 
      subcategory: "smartphone",
      brandModel: selectedValue,
      pastedUrl: null
    })
  }

  return (
    <div className="space-y-4 w-full">
      <div className="relative w-full" ref={dropdownRef}>
        {/* Clean Input replacing the magnifying glass CommandInput */}
        <Input
          placeholder="Select product..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
            // Reset parent state when typing fresh
            onChange({ ...value, brandModel: null, pastedUrl: null })
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-400 h-11 text-base"
        />

        {/* Absolute floating dropdown */}
        {isOpen && inputValue && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-950 border border-slate-800 rounded-md shadow-2xl overflow-hidden">
            <Command className="w-full bg-transparent">
              <CommandList className="max-h-60 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <CommandEmpty className="p-6 text-center text-sm text-slate-400">
                    <p className="mb-3">No product found in catalog.</p>
                    <Button
                      variant="outline"
                      className="text-xs border-slate-800 text-slate-300 hover:text-white"
                      onClick={() => {
                        setShowManualInput(true)
                        setIsOpen(false)
                      }}
                    >
                      Enter URL or Search Manually
                    </Button>
                  </CommandEmpty>
                ) : (
                  <CommandGroup className="p-1">
                    {filteredProducts.map((product) => (
                      <CommandItem
                        key={product.value}
                        value={product.value}
                        onSelect={() => handleSelect(product.value, product.label)}
                        className="cursor-pointer text-slate-200 hover:bg-slate-800 aria-selected:bg-slate-800 aria-selected:text-white py-3"
                      >
                        <Check
                          className={cn(
                            "mr-3 h-4 w-4 text-emerald-400",
                            value.brandModel === product.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {product.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>
        )}
      </div>

      {/* Manual URL Input directly syncing to DealSearchBar state */}
      {showManualInput && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
          <Input
            placeholder="Paste Amazon/Flipkart checkout URL..."
            value={value.pastedUrl || ""}
            onChange={(e) => onChange({
                ...value,
                category: null,
                subcategory: null,
                brandModel: null,
                pastedUrl: e.target.value
            })}
            className="w-full bg-slate-900 border-slate-800 text-slate-100 h-11"
          />
        </div>
      )}
    </div>
  )
}