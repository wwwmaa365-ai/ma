import React, { useState } from 'react';
import {
  Search,
  PlusCircle,
  Pencil,
  Trash2,
  Plus,
  Minus,
  Layers,
  Info,
  AlertTriangle,
} from 'lucide-react';
import {
  CATEGORY_IMAGE_FALLBACK,
  DemoPartnerProduct,
  PartnerCategory,
} from '../../data/partnerDemoData.ts';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RNImage,
  KeyboardAvoidingView,
} from '../rn/ReactNativePrimitives.tsx';

export type ProductSubView =
  | { type: 'LIST' }
  | { type: 'ADD_EDIT'; productId?: string }
  | { type: 'INVENTORY' };

export interface PartnerProductsModuleProps {
  products: DemoPartnerProduct[];
  subView: ProductSubView;
  onSetSubView: (view: ProductSubView) => void;
  onAddProduct: (payload: Omit<DemoPartnerProduct, 'id' | 'sku' | 'imageUrl'>) => void;
  onUpdateProduct: (id: string, updates: Partial<DemoPartnerProduct>) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateStock: (id: string, stock: number) => void;
}

const CATEGORIES: PartnerCategory[] = [
  'Musical Instruments',
  'Electronic Equipment',
  'Dance Dresses',
  'Dance Accessories',
];

export const PartnerProductsModule: React.FC<PartnerProductsModuleProps> = ({
  products,
  subView,
  onSetSubView,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateStock,
}) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'ALL' | PartnerCategory>('ALL');

  // Add/Edit Product Form State
  const editingProduct =
    subView.type === 'ADD_EDIT' && subView.productId
      ? products.find((p) => p.id === subView.productId)
      : undefined;

  const [name, setName] = useState(editingProduct?.name || '');
  const [category, setCategory] = useState<PartnerCategory>(
    editingProduct?.category || 'Musical Instruments'
  );
  const [subcategory, setSubcategory] = useState(
    editingProduct?.subcategory || 'Guitar'
  );
  const [priceInr, setPriceInr] = useState(
    String(editingProduct?.priceInr || 8999)
  );
  const [mrpInr, setMrpInr] = useState(String(editingProduct?.mrpInr || 10999));
  const [stock, setStock] = useState(String(editingProduct?.stock || 10));
  const [lowThreshold, setLowThreshold] = useState(
    String(editingProduct?.lowStockThreshold || 3)
  );
  const [description, setDescription] = useState(
    editingProduct?.description ||
      'Stage-tested musical/dance edition with seller warranty.'
  );

  const openAddOrEdit = (product?: DemoPartnerProduct) => {
    setName(product?.name || '');
    setCategory(product?.category || 'Musical Instruments');
    setSubcategory(product?.subcategory || 'Guitar');
    setPriceInr(String(product?.priceInr || 8999));
    setMrpInr(String(product?.mrpInr || 10999));
    setStock(String(product?.stock || 10));
    setLowThreshold(String(product?.lowStockThreshold || 3));
    setDescription(
      product?.description ||
        'Stage-tested musical/dance edition with seller warranty.'
    );
    onSetSubView({ type: 'ADD_EDIT', productId: product?.id });
  };

  // Screen 6: Add / Edit Product
  if (subView.type === 'ADD_EDIT') {
    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
        <KeyboardAvoidingView>
          <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-4 border border-purple-100 dark:border-purple-900/60 gap-3">
            <Text className="text-base font-extrabold text-slate-900 dark:text-white">
              {editingProduct ? 'Edit Product Details' : 'Add New Product SKU'}
            </Text>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                Product Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Yamaha Guitar, Harmonium, Kathak Dress..."
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                Category
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer ${
                      category === c
                        ? 'bg-[#4C1D95] text-amber-300'
                        : 'bg-purple-50 dark:bg-purple-950/60 text-slate-700 dark:text-purple-200 border border-purple-200 dark:border-purple-800'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                Subcategory
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="Guitar, Piano, Tabla, DJ Mixer, Bihu costumes..."
                className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                  Price (₹)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={priceInr}
                  onChange={(e) => setPriceInr(e.target.value)}
                  className="w-full min-h-[46px] px-3 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs font-mono-tabular text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                  MRP (₹)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={mrpInr}
                  onChange={(e) => setMrpInr(e.target.value)}
                  className="w-full min-h-[46px] px-3 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs font-mono-tabular text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                  Stock Qty
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full min-h-[46px] px-3 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs font-mono-tabular text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                  Low Alert ≤
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={lowThreshold}
                  onChange={(e) => setLowThreshold(e.target.value)}
                  className="w-full min-h-[46px] px-3 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs font-mono-tabular text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <TouchableOpacity
              onPress={() => {
                if (!name.trim()) return;
                const price = Math.max(99, Number(priceInr) || 999);
                const mrp = Math.max(price, Number(mrpInr) || price);
                const qty = Math.max(0, Number(stock) || 0);
                const low = Math.max(1, Number(lowThreshold) || 3);

                if (editingProduct) {
                  onUpdateProduct(editingProduct.id, {
                    name: name.trim(),
                    category,
                    subcategory: subcategory.trim() || category,
                    priceInr: price,
                    mrpInr: mrp,
                    stock: qty,
                    lowStockThreshold: low,
                    description: description.trim(),
                    imageUrl:
                      editingProduct.imageUrl || CATEGORY_IMAGE_FALLBACK[category],
                  });
                } else {
                  onAddProduct({
                    name: name.trim(),
                    category,
                    subcategory: subcategory.trim() || category,
                    priceInr: price,
                    mrpInr: mrp,
                    stock: qty,
                    lowStockThreshold: low,
                    warrantyMonths: 12,
                    description: description.trim(),
                  });
                }
                onSetSubView({ type: 'LIST' });
              }}
              className="w-full bg-[#4C1D95] text-amber-300 font-bold text-sm"
            >
              <span>
                {editingProduct
                  ? 'Save Product Changes'
                  : 'Publish Product to Store (Demo)'}
              </span>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    );
  }

  // Screen 8: Inventory Management
  if (subView.type === 'INVENTORY') {
    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3">
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/70 dark:border-amber-700/50 flex flex-row items-start gap-2 text-[11px] text-amber-900 dark:text-amber-200">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>Demo Inventory Manager — Adjust stock levels and monitor low-stock items.</span>
        </div>

        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => {
            const isLow = item.stock <= item.lowStockThreshold;
            return (
              <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2.5">
                <div className="flex flex-row items-center justify-between gap-2">
                  <div className="flex flex-col min-w-0 flex-1">
                    <Text
                      numberOfLines={1}
                      className="text-xs font-bold text-slate-900 dark:text-white"
                    >
                      {item.name}
                    </Text>
                    <span className="text-[11px] text-slate-500 dark:text-purple-300 font-mono-tabular">
                      {item.sku} · Alert ≤ {item.lowStockThreshold}
                    </span>
                  </div>
                  <div className="flex flex-row items-center gap-1 shrink-0">
                    {isLow && (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span
                      className={`text-lg font-extrabold font-mono-tabular ${
                        isLow
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {item.stock}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <TouchableOpacity
                    onPress={() => onUpdateStock(item.id, Math.max(0, item.stock - 1))}
                    className="bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800 text-xs font-bold"
                  >
                    <Minus className="w-4 h-4 shrink-0" />
                    <span>-1 Stock</span>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onUpdateStock(item.id, item.stock + 5)}
                    className="bg-[#4C1D95] text-amber-300 text-xs font-bold"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>+5 Restock</span>
                  </TouchableOpacity>
                </div>
              </View>
            );
          }}
        />
      </ScrollView>
    );
  }

  // Screen 7: Product Management List (All 15 Sample Products)
  const filtered = products.filter((p) => {
    const matchCat = catFilter === 'ALL' || p.category === catFilter;
    const q = search.trim().toLowerCase();
    const matchQ =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.subcategory.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3">
      <div className="relative w-full">
        <Search className="w-4 h-4 text-purple-600 dark:text-purple-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guitar, tabla, mixer, Bihu, ghungroo..."
          className="w-full min-h-[46px] pl-10 pr-3 py-2.5 rounded-2xl bg-white dark:bg-[#1E1136] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 w-full">
        <TouchableOpacity
          onPress={() => openAddOrEdit()}
          className="bg-[#4C1D95] text-amber-300 font-bold text-xs"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span className="truncate">Add Product</span>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSetSubView({ type: 'INVENTORY' })}
          className="bg-amber-500 text-slate-950 font-extrabold text-xs"
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span className="truncate">Inventory ({products.length})</span>
        </TouchableOpacity>
      </div>

      <ScrollView horizontal className="pb-1">
        {(['ALL', ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCatFilter(c)}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              catFilter === c
                ? 'bg-[#4C1D95] text-amber-300'
                : 'bg-white dark:bg-[#1E1136] text-slate-700 dark:text-purple-200 border border-purple-100 dark:border-purple-900/60'
            }`}
          >
            {c === 'ALL' ? `All (${products.length})` : c}
          </button>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => {
          const isLow = item.stock <= item.lowStockThreshold;
          return (
            <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 shadow-2xs gap-3">
              <div className="flex flex-row items-start gap-3 min-w-0">
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-purple-100 dark:border-purple-800 shrink-0">
                  <RNImage
                    source={item.imageUrl}
                    alt={item.name}
                    fallbackCategory={item.category}
                  />
                </div>

                <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                  <span className="text-[11px] font-bold text-purple-700 dark:text-amber-300 truncate">
                    {item.subcategory} · {item.sku}
                  </span>
                  <Text
                    numberOfLines={2}
                    className="text-xs font-bold text-slate-900 dark:text-white leading-snug"
                  >
                    {item.name}
                  </Text>
                  <div className="flex flex-row items-baseline gap-2 flex-wrap mt-0.5">
                    <span className="text-sm font-extrabold font-mono-tabular text-purple-950 dark:text-amber-300">
                      ₹{item.priceInr.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-slate-400 line-through font-mono-tabular">
                      ₹{item.mrpInr.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold font-mono-tabular ${
                      isLow
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    Stock: {item.stock} units {isLow ? '(Low Stock)' : ''}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-100 dark:border-purple-900/50">
                <TouchableOpacity
                  onPress={() => openAddOrEdit(item)}
                  className="bg-purple-50 dark:bg-purple-950/80 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800 text-xs font-bold"
                >
                  <Pencil className="w-3.5 h-3.5 shrink-0" />
                  <span>Edit</span>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onDeleteProduct(item.id)}
                  className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Delete</span>
                </TouchableOpacity>
              </div>
            </View>
          );
        }}
      />
    </ScrollView>
  );
};
