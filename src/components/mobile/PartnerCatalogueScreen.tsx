import React, { useState } from 'react';
import {
  Search,
  Plus,
  Minus,
  PlusCircle,
  AlertTriangle,
  Package,
  SlidersHorizontal,
} from 'lucide-react';
import { CategoryNode, ProductItem } from '../../types/platform.ts';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RNImage,
  BottomSheetModal,
} from '../rn/ReactNativePrimitives.tsx';

export interface PartnerCatalogueScreenProps {
  categories: CategoryNode[];
  products: ProductItem[];
  showAddModal: boolean;
  onSetShowAddModal: (visible: boolean) => void;
  onUpdateStock: (productId: string, stock: number, lowStockThreshold?: number) => Promise<void>;
  onCreateProduct: (payload: {
    name: string;
    sku: string;
    category: string;
    subcategory: string;
    priceInr: number;
    mrpInr: number;
    stock: number;
    lowStockThreshold: number;
    warrantyMonths: number;
    deliveryEstimateDays: string;
    description: string;
    images: string[];
  }) => Promise<{ ok: boolean; error?: string }>;
  onRefresh: () => Promise<void> | void;
}

const PRESET_PRODUCT_IMAGES: Record<string, string> = {
  'Musical Instruments': '/src/assets/images/product_acoustic_guitar_1795061118777.jpg',
  'Electronic Musical Equipment': '/src/assets/images/product_dj_mixer_1795061118856.jpg',
  'Dance Dresses': '/src/assets/images/product_bharatanatyam_dress_1795061118744.jpg',
  'Dance Accessories': '/src/assets/images/product_tabla_set_1795061118537.jpg',
};

export const PartnerCatalogueScreen: React.FC<PartnerCatalogueScreenProps> = ({
  categories,
  products,
  showAddModal,
  onSetShowAddModal,
  onUpdateStock,
  onCreateProduct,
  onRefresh,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editStockVal, setEditStockVal] = useState<string>('10');
  const [editThresholdVal, setEditThresholdVal] = useState<string>('3');

  // New Product Form State
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newCat, setNewCat] = useState(categories[0]?.name || 'Musical Instruments');
  const [newSubcat, setNewSubcat] = useState(
    categories[0]?.subcategories[0] || 'Acoustic Guitar'
  );
  const [newPrice, setNewPrice] = useState('14999');
  const [newMrp, setNewMrp] = useState('18999');
  const [newStock, setNewStock] = useState('12');
  const [newThreshold, setNewThreshold] = useState('3');
  const [newWarranty, setNewWarranty] = useState('12');
  const [newDesc, setNewDesc] = useState(
    'Concert-grade handcrafted edition with warranty and padded gig bag.'
  );
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activeCategoryNode =
    categories.find((c) => c.name === newCat) || categories[0];

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'ALL' || p.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.subcategory.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newName.trim()) {
      setFormError('Please enter a product name.');
      return;
    }
    setSubmitting(true);
    try {
      const priceNum = Math.max(99, Number(newPrice) || 1499);
      const mrpNum = Math.max(priceNum, Number(newMrp) || priceNum);
      const res = await onCreateProduct({
        name: newName.trim(),
        sku:
          newSku.trim() ||
          `SMS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        category: newCat,
        subcategory: newSubcat,
        priceInr: priceNum,
        mrpInr: mrpNum,
        stock: Math.max(0, Number(newStock) || 10),
        lowStockThreshold: Math.max(1, Number(newThreshold) || 3),
        warrantyMonths: Math.max(0, Number(newWarranty) || 12),
        deliveryEstimateDays: '2-4 Days Express Delivery',
        description: newDesc.trim(),
        images: [
          PRESET_PRODUCT_IMAGES[newCat] ||
            '/src/assets/images/product_acoustic_guitar_1795061118777.jpg',
        ],
      });
      if (!res.ok) {
        setFormError(res.error || 'Could not create product.');
      } else {
        setNewName('');
        setNewSku('');
        onSetShowAddModal(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveStockEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    await onUpdateStock(
      editingProduct.productId,
      Math.max(0, Number(editStockVal) || 0),
      Math.max(1, Number(editThresholdVal) || 3)
    );
    setEditingProduct(null);
  };

  return (
    <ScrollView
      onRefresh={onRefresh}
      contentContainerClassName="px-3.5 pt-3 pb-24 gap-3"
    >
      {/* Top Action Row: Search + Add Product Button */}
      <div className="flex flex-row items-center gap-2 w-full">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-purple-600 dark:text-purple-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU, guitar, tabla, dress..."
            className="w-full min-h-[46px] pl-10 pr-3 py-2.5 rounded-2xl bg-white dark:bg-[#1E1136] border border-purple-200 dark:border-purple-800/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-2 focus:outline-purple-700"
          />
        </div>

        <button
          type="button"
          onClick={() => onSetShowAddModal(true)}
          className="min-h-[46px] px-3.5 rounded-2xl bg-gradient-to-r from-[#4C1D95] to-[#6D28D9] text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-sm shrink-0 active:scale-95 transition-transform cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>Add SKU</span>
        </button>
      </div>

      {/* Category Filter Scroller */}
      <ScrollView horizontal className="pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'bg-[#4C1D95] text-amber-300 shadow-xs'
              : 'bg-white dark:bg-[#1E1136] text-slate-700 dark:text-purple-200 border border-purple-100 dark:border-purple-900/60'
          }`}
        >
          All Categories ({products.length})
        </button>
        {categories.map((cat) => {
          const active = selectedCategory === cat.name;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.name)}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-[#4C1D95] text-amber-300 shadow-xs'
                  : 'bg-white dark:bg-[#1E1136] text-slate-700 dark:text-purple-200 border border-purple-100 dark:border-purple-900/60'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </ScrollView>

      {/* Product Inventory FlatList */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.productId}
        renderItem={({ item: product }) => {
          const available = product.stock - product.reservedStock;
          const isLow = available <= product.lowStockThreshold;

          return (
            <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 shadow-2xs gap-3">
              <div className="flex flex-row items-start gap-3 min-w-0">
                {/* Product Image (No Distortion, 1:1 Aspect) */}
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-purple-100 dark:border-purple-800 shrink-0">
                  <RNImage
                    source={product.images[0]}
                    alt={product.name}
                    fallbackCategory={product.category}
                  />
                </div>

                {/* Product Metadata & Pricing */}
                <div className="flex flex-col min-w-0 flex-1 gap-1">
                  <div className="flex flex-row items-center justify-between gap-1">
                    <span className="text-[11px] font-medium text-purple-700 dark:text-amber-300 truncate">
                      {product.subcategory}
                    </span>
                    <span className="text-[10px] font-mono-tabular text-slate-400 shrink-0">
                      {product.sku}
                    </span>
                  </div>

                  <Text
                    numberOfLines={2}
                    className="text-sm font-bold text-slate-900 dark:text-white leading-snug"
                  >
                    {product.name}
                  </Text>

                  <div className="flex flex-row items-baseline gap-2 flex-wrap mt-0.5">
                    <span className="text-sm font-extrabold text-purple-950 dark:text-amber-300 font-mono-tabular">
                      ₹{product.priceInr.toLocaleString('en-IN')}
                    </span>
                    {product.mrpInr > product.priceInr && (
                      <span className="text-xs text-slate-400 line-through font-mono-tabular">
                        ₹{product.mrpInr.toLocaleString('en-IN')}
                      </span>
                    )}
                    {product.discountPercent > 0 && (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        {product.discountPercent}% OFF
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stock Level & Touch-Friendly Adjustment Bar */}
              <div className="pt-2.5 border-t border-purple-100 dark:border-purple-900/60 flex flex-row items-center justify-between gap-2 flex-wrap">
                <div className="flex flex-col min-w-0">
                  <div className="flex flex-row items-center gap-1.5">
                    {isLow ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : (
                      <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                    <span
                      className={`text-xs font-bold font-mono-tabular ${
                        isLow
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-slate-800 dark:text-purple-100'
                      }`}
                    >
                      {available} in stock
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-purple-300 font-mono-tabular">
                    Reserved: {product.reservedStock} · Alert ≤{' '}
                    {product.lowStockThreshold}
                  </span>
                </div>

                {/* Touch Target Controls */}
                <div className="flex flex-row items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    aria-label="Decrease stock by 1"
                    onClick={() =>
                      onUpdateStock(
                        product.productId,
                        Math.max(0, product.stock - 1)
                      )
                    }
                    className="min-w-[42px] min-h-[42px] rounded-xl bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-900 dark:text-purple-100 active:scale-95 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    aria-label="Increase stock by 5"
                    onClick={() =>
                      onUpdateStock(product.productId, product.stock + 5)
                    }
                    className="min-h-[42px] px-3 rounded-xl bg-[#4C1D95] text-amber-300 text-xs font-bold flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>5</span>
                  </button>

                  <button
                    type="button"
                    aria-label="Edit stock settings"
                    onClick={() => {
                      setEditingProduct(product);
                      setEditStockVal(String(product.stock));
                      setEditThresholdVal(String(product.lowStockThreshold));
                    }}
                    className="min-w-[42px] min-h-[42px] rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-700 dark:text-amber-300 active:scale-95 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </View>
          );
        }}
      />

      {/* Add New Product Bottom Sheet (KeyboardAvoidingView Wrapped) */}
      <BottomSheetModal
        visible={showAddModal}
        title="Add New Musical or Dance SKU"
        subtitle="Publishes immediately to your branded mobile store"
        onClose={() => onSetShowAddModal(false)}
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-800 dark:text-purple-100">
              Product Title *
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Yamaha F310 Acoustic Guitar / Assam Silk Bihu Dress"
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-800 dark:text-purple-100">
                Master Category
              </label>
              <select
                value={newCat}
                onChange={(e) => {
                  const nextCat = e.target.value;
                  setNewCat(nextCat);
                  const found = categories.find((c) => c.name === nextCat);
                  if (found && found.subcategories[0]) {
                    setNewSubcat(found.subcategories[0]);
                  }
                }}
                className="w-full min-h-[46px] px-3 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-800 dark:text-purple-100">
                Subcategory
              </label>
              <select
                value={newSubcat}
                onChange={(e) => setNewSubcat(e.target.value)}
                className="w-full min-h-[46px] px-3 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
              >
                {(activeCategoryNode?.subcategories || []).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-800 dark:text-purple-100">
                Selling Price (₹)
              </label>
              <input
                type="number"
                inputMode="numeric"
                required
                min={99}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full min-h-[46px] px-3 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs font-mono-tabular text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-800 dark:text-purple-100">
                MRP (₹)
              </label>
              <input
                type="number"
                inputMode="numeric"
                required
                min={99}
                value={newMrp}
                onChange={(e) => setNewMrp(e.target.value)}
                className="w-full min-h-[46px] px-3 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs font-mono-tabular text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-800 dark:text-purple-100 truncate">
                Initial Stock
              </label>
              <input
                type="number"
                inputMode="numeric"
                required
                min={0}
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="w-full min-h-[46px] px-2.5 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs font-mono-tabular text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-800 dark:text-purple-100 truncate">
                Low Alert ≤
              </label>
              <input
                type="number"
                inputMode="numeric"
                required
                min={1}
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
                className="w-full min-h-[46px] px-2.5 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs font-mono-tabular text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-800 dark:text-purple-100 truncate">
                Warranty (Mo)
              </label>
              <input
                type="number"
                inputMode="numeric"
                required
                min={0}
                value={newWarranty}
                onChange={(e) => setNewWarranty(e.target.value)}
                className="w-full min-h-[46px] px-2.5 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs font-mono-tabular text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-800 dark:text-purple-100">
              Description & Specifications
            </label>
            <textarea
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          {formError && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-[#4C1D95] to-[#6D28D9] text-amber-300 font-bold text-sm shadow-md active:scale-[0.98] transition-transform cursor-pointer"
          >
            {submitting ? 'Publishing SKU...' : 'Publish Product to Store'}
          </button>
        </form>
      </BottomSheetModal>

      {/* Edit Stock & Low-Stock Threshold Sheet */}
      <BottomSheetModal
        visible={Boolean(editingProduct)}
        title="Update Inventory & Alert Threshold"
        subtitle={editingProduct?.name}
        onClose={() => setEditingProduct(null)}
      >
        {editingProduct && (
          <form onSubmit={handleSaveStockEdit} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-800 dark:text-purple-100">
                  Total Physical Stock
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  required
                  value={editStockVal}
                  onChange={(e) => setEditStockVal(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-sm font-bold font-mono-tabular text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-800 dark:text-purple-100">
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  required
                  value={editThresholdVal}
                  onChange={(e) => setEditThresholdVal(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-sm font-bold font-mono-tabular text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-[#4C1D95] text-amber-300 font-bold text-sm shadow-md active:scale-[0.98] transition-transform cursor-pointer"
            >
              Save Inventory Update
            </button>
          </form>
        )}
      </BottomSheetModal>
    </ScrollView>
  );
};
