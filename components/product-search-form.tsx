"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

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
import { Label } from "@/components/ui/label"
import {
  defaultProductSearchParams,
  type ProductSearchParams,
} from "@/lib/product-search"

const products = [
  { value: "apple iphone 15 pro", label: "Apple iPhone 15 Pro" },
  { value: "samsung galaxy s24 ultra", label: "Samsung Galaxy S24 Ultra" },
  { value: "google pixel 8 pro", label: "Google Pixel 8 Pro" },
  { value: "macbook pro m3", label: "MacBook Pro M3" },
  { value: "dell xps 15", label: "Dell XPS 15" },
]

type ProductSearchFormProps = {
  value?: ProductSearchParams
  onChange?: (params: ProductSearchParams) => void
  onSearch: (query: string) => void // New prop for triggering search
}

export function ProductSearchForm({
  value = defaultProductSearchParams(),
  onChange,
  onSearch,
}: ProductSearchFormProps) {
  const [open, setOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState("")

  const handleSearch = () => {
    const query = selectedProduct || `${manualInput} official price`
    onSearch(query)
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">
          What are you looking for?
        </Label>
        <div className="flex gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[200px] justify-between"
              >
                {selectedProduct
                  ? products.find((p) => p.value === selectedProduct)?.label
                  : "Select product..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput
                  placeholder="Search product..."
                  onValueChange={setManualInput}
                />
                <CommandList>
                  <CommandEmpty>No product found.</CommandEmpty>
                  <CommandGroup>
                    {products.map((product) => (
                      <CommandItem
                        key={product.value}
                        value={product.value}
                        onSelect={(currentValue) => {
                          setSelectedProduct(
                            currentValue === selectedProduct ? null : currentValue
                          )
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedProduct === product.value
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {product.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Button onClick={handleSearch} disabled={!selectedProduct && !manualInput}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
