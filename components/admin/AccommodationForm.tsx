'use client';

import { useState } from 'react';
import { AccommodationOption } from '@/lib/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface AccommodationFormProps {
  option?: AccommodationOption;
  onSubmit: (optionData: Omit<AccommodationOption, 'id'>) => void;
  onCancel: () => void;
}

export default function AccommodationForm({ option, onSubmit, onCancel }: AccommodationFormProps) {
  const [title, setTitle] = useState(option?.title || '');
  const [description, setDescription] = useState(option?.description || '');
  const [price, setPrice] = useState(option?.price || '');
  const [icon, setIcon] = useState<'utensils' | 'bed'>(option?.icon || 'bed');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!price.trim()) newErrors.price = 'Price is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit({
      title,
      description,
      price,
      icon,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setPrice('');
    setIcon('bed');
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-md mb-8">
      <h3 className="text-xl font-bold text-foreground mb-6">
        {option ? 'Edit Accommodation Option' : 'Add Accommodation Option'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
            Option Title
          </label>
          <Input
            id="title"
            type="text"
            placeholder="e.g., Accommodation + Food"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-foreground mb-2">
            Price
          </label>
          <Input
            id="price"
            type="text"
            placeholder="e.g., ₹5,999"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={errors.price ? 'border-red-500' : ''}
          />
          {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
          Description
        </label>
        <Textarea
          id="description"
          placeholder="Enter option description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
      </div>

      {/* Icon Selection */}
      <div className="mb-8">
        <label htmlFor="icon" className="block text-sm font-medium text-foreground mb-2">
          Icon Type
        </label>
        <select
          id="icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value as 'utensils' | 'bed')}
          className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="bed">Bed (Accommodation)</option>
          <option value="utensils">Utensils (Food)</option>
        </select>
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="px-6"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="px-6 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {option ? 'Update Option' : 'Add Option'}
        </Button>
      </div>
    </form>
  );
}
