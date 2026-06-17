import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCustomers } from '@/hooks/useCustomers'
import { useProducts } from '@/hooks/useProducts'
import client from '@/api/client'

const schema = z.object({
  customer_id: z.string().min(1, 'Select a customer'),
  items: z.array(
    z.object({
      product_id: z.string().min(1, 'Select a product'),
      quantity: z.coerce.number().int().min(1, 'Quantity must be ≥ 1'),
    })
  ).min(1, 'Add at least one item'),
})

type FormInput = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

interface Props {
  onSuccess: () => void
}

export function OrderForm({ onSuccess }: Props) {
  const { customers } = useCustomers()
  const { products } = useProducts()

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { customer_id: '', items: [{ product_id: '', quantity: '1' }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const watchedItems = useWatch({ control, name: 'items' })

  const estimatedTotal = (watchedItems || []).reduce((sum, item) => {
    if (!item) return sum
    const product = products.find(p => p.id === Number(item.product_id))
    if (!product || !item.quantity) return sum
    return sum + Number(product.price) * Number(item.quantity)
  }, 0)

  const mutation = useMutation<void, AxiosError<{ detail?: string }>, FormOutput>({
    mutationFn: async (values: FormOutput) => {
      await client.post('/orders', {
        customer_id: Number(values.customer_id),
        items: values.items.map(i => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
        })),
      })
    },
    onSuccess: () => {
      toast.success('Order created')
      onSuccess()
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || err.message
      toast.error(msg ?? 'Something went wrong')
    },
  })

  const onSubmit = (values: FormOutput) => {
    mutation.mutate(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <Label>Customer</Label>
        <Select onValueChange={v => setValue('customer_id', v as string, { shouldValidate: true })}>
          <SelectTrigger>
            <SelectValue placeholder="Select customer…" />
          </SelectTrigger>
          <SelectContent>
            {customers.map(c => (
              <SelectItem key={c.id} value={String(c.id)}>{c.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.customer_id && <p className="text-destructive text-xs mt-1">{errors.customer_id.message}</p>}
      </div>

      <div className="space-y-3">
        <Label>Items</Label>
        {fields.map((field, index) => (
          <div key={field.id} className="flex flex-col sm:flex-row gap-2 items-start">
            <div className="flex-1">
              <Select onValueChange={v => setValue(`items.${index}.product_id`, v as string, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product…" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} (stock: {p.quantity_in_stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.items?.[index]?.product_id && (
                <p className="text-destructive text-xs mt-1">{errors.items[index].product_id?.message}</p>
              )}
            </div>
            <div className="w-full sm:w-24">
              <Input type="number" min={1} placeholder="Qty" {...register(`items.${index}.quantity`)} />
              {errors.items?.[index]?.quantity && (
                <p className="text-destructive text-xs mt-1">{errors.items[index].quantity?.message}</p>
              )}
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', quantity: '1' })}>
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
        {errors.items?.root && <p className="text-destructive text-xs">{errors.items.root.message}</p>}
      </div>

      {estimatedTotal > 0 && (
        <p className="text-sm text-muted-foreground">
          Estimated total: <span className="font-semibold text-foreground">${estimatedTotal.toFixed(2)}</span>
        </p>
      )}

      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? 'Placing order…' : 'Place Order'}
      </Button>
    </form>
  )
}
