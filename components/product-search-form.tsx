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
import { useToast } from "@/hooks/use-toast"

const DEMO_PRODUCTS = [
  { value: "apple iphone 17 pro", label: "Apple iPhone 17 Pro" },
  { value: "apple iphone 15 pro", label: "Apple iPhone 15 Pro" },
  { value: "samsung galaxy s24 ultra", label: "Samsung Galaxy S24 Ultra" },
  { value: "google pixel 8 pro", label: "Google Pixel 8 Pro" },
  { value: "macbook pro m3", label: "MacBook Pro M3" },
  { value: "sony playstation 5", label: "Sony PlayStation 5" },
]

type ProductSearchFormProps = {
  onSearch: (query: string) => void
}

export function ProductSearchForm({ onSearch }: ProductSearchFormProps) {
  const [inputValue, setInputValue] = useState("")
  const [selectedValue, setSelectedValue] = useState<string | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualUrl, setManualUrl] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

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

  const handleSelect = (value: string, label: string) => {
    setSelectedValue(value)
    setInputValue(label) 
    setIsOpen(false)
    setShowManualInput(false)
    setManualUrl("")
  }

  const handleSearch = () => {
    if (selectedValue) {
      onSearch(selectedValue)
    } else if (showManualInput && manualUrl) {
      onSearch(manualUrl)
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Product",
        description: "Please select a valid product from the dropdown list or enter a URL.",
      })
    }
  }

  return (
    <div className="space-y-4 w-full">
      <div className="relative w-full" ref={dropdownRef}>
        <Input
          placeholder="Select product..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
            setSelectedValue(null)
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-400 h-12 text-base"
        />

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
                            selectedValue === product.value ? "opacity-100" : "opacity-0"
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

      {showManualInput && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
          <Input
            placeholder="Paste Amazon/Flipkart checkout URL..."
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            className="w-full bg-slate-900 border-slate-800 text-slate-100 h-12"
          />
        </div>
      )}

      <Button 
        onClick={handleSearch} 
        className="w-full h-12 bg-[#4ade80] text-emerald-950 hover:bg-[#22c55e] font-semibold text-base transition-colors"
      >
        Search & rank my cards
      </Button>
    </div>
  )
}