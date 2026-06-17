import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import client from '@/api/client'
import type { Product } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.coerce.number().min(0, 'Price must be ≥ 0'),
  quantity_in_stock: z.coerce.number().int().min(0, 'Quantity must be ≥ 0'),
})

type FormInput = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

interface Props {
  product?: Product
  onSuccess: () => void
}

export function ProductForm({ product, onSuccess }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: product
      ? { name: product.name, sku: product.sku, price: String(product.price), quantity_in_stock: String(product.quantity_in_stock) }
      : { quantity_in_stock: '0' },
  })

  const onSubmit = async (values: FormOutput) => {
    try {
      if (product) {
        await client.put(`/products/${product.id}`, values)
        toast.success('Product updated')
      } else {
        await client.post('/products', values)
        toast.success('Product created')
      }
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg ?? 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="sku">SKU</Label>
        <Input id="sku" {...register('sku')} />
        {errors.sku && <p className="text-destructive text-xs mt-1">{errors.sku.message}</p>}
      </div>
      <div>
        <Label htmlFor="price">Price</Label>
        <Input id="price" type="number" step="0.01" {...register('price')} />
        {errors.price && <p className="text-destructive text-xs mt-1">{errors.price.message}</p>}
      </div>
      <div>
        <Label htmlFor="qty">Quantity in Stock</Label>
        <Input id="qty" type="number" {...register('quantity_in_stock')} />
        {errors.quantity_in_stock && <p className="text-destructive text-xs mt-1">{errors.quantity_in_stock.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving…' : product ? 'Update Product' : 'Create Product'}
      </Button>
    </form>
  )
}
