import React from 'react';
import { groceryList } from '../data';
import { Leaf, Egg, Wheat, Cherry } from 'lucide-react';

export default function GroceryList() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-extrabold text-stone-900">一周采购清单</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Vegetables */}
        <div className="bg-white rounded-3xl shadow-sm border border-teal-100 p-6 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-500 flex items-center justify-center">
              <Leaf size={24} />
            </div>
            <h3 className="text-lg font-bold text-teal-900">蔬菜</h3>
          </div>
          <ul className="space-y-3">
            {groceryList.vegetables.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-stone-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-teal-300 mt-2 shrink-0"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Protein */}
        <div className="bg-white rounded-3xl shadow-sm border border-rose-100 p-6 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <Egg size={24} />
            </div>
            <h3 className="text-lg font-bold text-rose-900">优质蛋白</h3>
          </div>
          <ul className="space-y-3">
            {groceryList.protein.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-stone-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-300 mt-2 shrink-0"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Carbs */}
        <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Wheat size={24} />
            </div>
            <h3 className="text-lg font-bold text-amber-900">主食</h3>
          </div>
          <ul className="space-y-3">
            {groceryList.carbs.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-stone-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-300 mt-2 shrink-0"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Fruits */}
        <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-6 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <Cherry size={24} />
            </div>
            <h3 className="text-lg font-bold text-orange-900">水果</h3>
          </div>
          <ul className="space-y-3">
            {groceryList.fruits.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-stone-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-orange-300 mt-2 shrink-0"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
