const Brand = require("../../models/admin/brandModal");
const Category = require("../../models/admin/categoryModel");
const Type = require("../../models/admin/typeModal");
const Car = require("../../models/admin/productCarModal");
const Accessory = require("../../models/admin/productAccessoryModal");

async function filterAndSearchProductUser(query, whichProduct) {
  let { FilterPrice, FilterBrands, FilterCategories, FilterTypes, search } =
    query;

  // Convert CSV strings into arrays (backend receives "BMW,Audi")
  FilterPrice =
    typeof FilterPrice === "string"
      ? FilterPrice.split(",")
      : FilterPrice || [];
  FilterBrands =
    typeof FilterBrands === "string"
      ? FilterBrands.split(",")
      : FilterBrands || [];
  FilterCategories =
    typeof FilterCategories === "string"
      ? FilterCategories.split(",")
      : FilterCategories || [];
  FilterTypes =
    typeof FilterTypes === "string"
      ? FilterTypes.split(",")
      : FilterTypes || [];

  const hasFilters =
    FilterPrice.length ||
    FilterBrands.length ||
    FilterCategories.length ||
    FilterTypes.length ||
    search;

  if (!hasFilters) return null;

  const filter = { isListed: true };
  let sortByPrice = { createdAt: -1 };

  // Price filter
  if (FilterPrice.length) {
    if (FilterPrice.includes("low-price")) sortByPrice = { price: 1 };
    if (FilterPrice.includes("high-price")) sortByPrice = { price: -1 };
  }

  // Brand filter
  if (FilterBrands.length) {
    const brands = await Brand.find({ name: { $in: FilterBrands } }).lean();
    filter.brand_id = { $in: brands.map((b) => b._id) };
  }

  // Category filter
  if (FilterCategories.length) {
    const categories = await Category.find({
      name: { $in: FilterCategories },
    }).lean();
    filter.category_id = { $in: categories.map((c) => c._id) };
  }

  // Type filter
  if (FilterTypes.length) {
    const types = await Type.find({ name: { $in: FilterTypes } }).lean();
    filter.product_type_id = { $in: types.map((t) => t._id) };
  }

  // Search
  if (search && search.trim()) {
    const regex = new RegExp(search.split("").join("[^a-zA-Z0-9]*"), "i");
    filter.$or = [{ name: regex }];
  }

  if (whichProduct === "accessory") {
    return await Accessory.find(filter)
      .sort(sortByPrice)
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("product_type_id", "name")
      .lean();
  }

  if (whichProduct === "car") {
    return await Car.find(filter)
      .sort(sortByPrice)
      .populate("brand_id", "name")
      .populate("category_id", "name")
      .populate("product_type_id", "name")
      .populate("variantIds", "image_url")
      .lean();
  }
}

module.exports = { filterAndSearchProductUser };
