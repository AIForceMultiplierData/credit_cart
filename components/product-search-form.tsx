"use client"

import { useState } from "react"
import { Check } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

const DEMO_PRODUCTS = [
  { value: "apple iphone 15 pro", label: "Apple iPhone 15 Pro" },
  { value: "samsung galaxy s24 ultra", label: "Samsung Galaxy S24 Ultra" },
  { value: "google pixel 8 pro", label: "Google Pixel 8 Pro" },
  { value: "macbook pro m3", label: "MacBook Pro M3" },
  { value: "dell xps 15", label: "Dell XPS 15" },
]

type ProductSearchFormProps = {
  onSearch: (query: string) => void
}

export function ProductSearchForm({ onSearch }: ProductSearchFormProps) {
  const [inputValue, setInputValue] = useState("")
  const [selectedValue, setSelectedValue] = useState<string | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualUrl, setManualUrl] = useState("")
  const { toast } = useToast()

  const handleSelect = (currentValue: string, label: string) => {
    const value = currentValue === selectedValue ? null : currentValue
    setSelectedValue(value)
    setInputValue(value ? label : "")
    if (value) {
      setShowManualInput(false)
      setManualUrl("")
    }
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
        description: "Please select a valid product from the list.",
      })
    }
  }

  return (
    <div className="space-y-3 w-full">
      <Command className="w-full">
        <CommandInput
          placeholder="What are you looking for?"
          value={inputValue}
          onValueChange={setInputValue}
        />
        <CommandList>
          <CommandEmpty>
            <div className="text-center p-4">
              <p>No product found.</p>
              <Button
                variant="link"
                className="text-xs"
                onClick={() => setShowManualInput(true)}
              >
                Enter URL or Search Manually
              </Button>
            </div>
          </CommandEmpty>
          <CommandGroup>
            {DEMO_PRODUCTS.filter(
              (product) =>
                !inputValue ||
                product.label.toLowerCase().includes(inputValue.toLowerCase())
            ).map((product) => (
              <CommandItem
                key={product.value}
                value={product.value}
                onSelect={(currentValue) => {
                  handleSelect(currentValue, product.label)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedValue === product.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {product.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>

      {showManualInput && (
        <div className="space-y-2">
          <Input
            placeholder="Enter product URL"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
          />
        </div>
      )}

      <Button onClick={handleSearch} className="w-full">
        Search & rank my cards
      </Button>
    </div>
  )
}
