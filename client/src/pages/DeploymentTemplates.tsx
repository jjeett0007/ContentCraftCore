import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Terminal,
  CheckCircle,
  AlertTriangle,
  FileText,
  ShoppingBag,
  Users,
  Calendar,
  Image,
  FileCode,
  Newspaper,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Define template categories
const categories = [
  { id: "business", name: "Business" },
  { id: "blog", name: "Blog & CMS" },
  { id: "ecommerce", name: "E-commerce" },
  { id: "portfolio", name: "Portfolio" },
  { id: "custom", name: "Custom" },
];

// Template definitions
const templates = [
  {
    id: "blog-basic",
    name: "Basic Blog",
    description: "A simple blog with posts, categories, and authors",
    category: "blog",
    icon: <Newspaper className="h-8 w-8" />,
    contentTypes: [
      {
        displayName: "Blog Posts",
        apiId: "blog-posts",
        description: "Blog posts for your site",
        fields: [
          {
            name: "title",
            displayName: "Title",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "content",
            displayName: "Content",
            type: "richText",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "slug",
            displayName: "Slug",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "featuredImage",
            displayName: "Featured Image",
            type: "media",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "excerpt",
            displayName: "Excerpt",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "category",
            displayName: "Category",
            type: "relation",
            required: false,
            unique: false,
            relationMany: false,
            relationTo: "blog-categories",
          },
          {
            name: "author",
            displayName: "Author",
            type: "relation",
            required: true,
            unique: false,
            relationMany: false,
            relationTo: "blog-authors",
          },
          {
            name: "tags",
            displayName: "Tags",
            type: "text",
            required: false,
            unique: false,
            relationMany: true,
          },
          {
            name: "publishedDate",
            displayName: "Published Date",
            type: "date",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "status",
            displayName: "Status",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["draft", "published", "archived"],
          },
        ],
      },
      {
        displayName: "Categories",
        apiId: "blog-categories",
        description: "Categories for blog posts",
        fields: [
          {
            name: "name",
            displayName: "Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "slug",
            displayName: "Slug",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
        ],
      },
      {
        displayName: "Authors",
        apiId: "blog-authors",
        description: "Authors for blog posts",
        fields: [
          {
            name: "name",
            displayName: "Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "bio",
            displayName: "Biography",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "email",
            displayName: "Email",
            type: "email",
            required: false,
            unique: true,
            relationMany: false,
          },
          {
            name: "avatar",
            displayName: "Avatar",
            type: "media",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "socialLinks",
            displayName: "Social Links",
            type: "json",
            required: false,
            unique: false,
            relationMany: false,
          },
        ],
      },
    ],
  },
  {
    id: "ecommerce-basic",
    name: "General E-commerce Store",
    description: "Basic e-commerce setup with products, categories, and orders",
    category: "ecommerce",
    icon: <ShoppingBag className="h-8 w-8" />,
    contentTypes: [
      {
        displayName: "Products",
        apiId: "products",
        description: "Products for your store",
        fields: [
          {
            name: "name",
            displayName: "Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "richText",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "price",
            displayName: "Price",
            type: "number",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "salePrice",
            displayName: "Sale Price",
            type: "number",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "slug",
            displayName: "Slug",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "sku",
            displayName: "SKU",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "inventory",
            displayName: "Inventory Count",
            type: "number",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "images",
            displayName: "Product Images",
            type: "media",
            required: false,
            unique: false,
            relationMany: true,
          },
          {
            name: "category",
            displayName: "Category",
            type: "relation",
            required: false,
            unique: false,
            relationMany: false,
            relationTo: "product_categories",
          },
          {
            name: "featured",
            displayName: "Featured Product",
            type: "boolean",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "status",
            displayName: "Status",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["draft", "published", "out-of-stock"],
          },
        ],
      },
      {
        displayName: "Product Categories",
        apiId: "product_categories",
        description: "Categories for products",
        fields: [
          {
            name: "name",
            displayName: "Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "slug",
            displayName: "Slug",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "image",
            displayName: "Category Image",
            type: "media",
            required: false,
            unique: false,
            relationMany: false,
          },
        ],
      },
      {
        displayName: "Orders",
        apiId: "orders",
        description: "Customer orders",
        fields: [
          {
            name: "orderNumber",
            displayName: "Order Number",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "customer",
            displayName: "Customer",
            type: "relation",
            required: true,
            unique: false,
            relationMany: false,
            relationTo: "customers",
          },
          {
            name: "products",
            displayName: "Products",
            type: "relation",
            required: true,
            unique: false,
            relationMany: true,
            relationTo: "products",
          },
          {
            name: "totalPrice",
            displayName: "Total Price",
            type: "number",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "status",
            displayName: "Status",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: [
              "pending",
              "processing",
              "shipped",
              "delivered",
              "cancelled",
            ],
          },
          {
            name: "shippingAddress",
            displayName: "Shipping Address",
            type: "json",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "billingAddress",
            displayName: "Billing Address",
            type: "json",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "paymentMethod",
            displayName: "Payment Method",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["credit-card", "paypal", "bank-transfer"],
          },
          {
            name: "orderDate",
            displayName: "Order Date",
            type: "date",
            required: true,
            unique: false,
            relationMany: false,
          },
        ],
      },
      {
        displayName: "Customers",
        apiId: "customers",
        description: "Store customers",
        fields: [
          {
            name: "email",
            displayName: "Email",
            type: "email",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "firstName",
            displayName: "First Name",
            type: "text",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "lastName",
            displayName: "Last Name",
            type: "text",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "phone",
            displayName: "Phone Number",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "addresses",
            displayName: "Addresses",
            type: "json",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "orders",
            displayName: "Orders",
            type: "relation",
            required: false,
            unique: false,
            relationMany: true,
            relationTo: "orders",
          },
        ],
      },
    ],
  },
  {
    id: "ecommerce-digital",
    name: "Digital Products Store",
    description: "E-commerce setup for digital products, downloads, and services",
    category: "ecommerce",
    icon: <FileCode className="h-8 w-8" />,
    contentTypes: [
      {
        displayName: "Digital Products",
        apiId: "digital_products",
        description: "Digital products for your store",
        fields: [
          {
            name: "name",
            displayName: "Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "richText",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "price",
            displayName: "Price",
            type: "number",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "slug",
            displayName: "Slug",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "productFile",
            displayName: "Product File",
            type: "media",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "fileType",
            displayName: "File Type",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["pdf", "video", "audio", "ebook", "software", "image", "other"],
          },
          {
            name: "fileSize",
            displayName: "File Size (MB)",
            type: "number",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "previewImage",
            displayName: "Preview Image",
            type: "media",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "additionalImages",
            displayName: "Additional Images",
            type: "media",
            required: false,
            unique: false,
            relationMany: true,
          },
          {
            name: "category",
            displayName: "Category",
            type: "relation",
            required: false,
            unique: false,
            relationMany: false,
            relationTo: "digital-product-categories",
          },
          {
            name: "featured",
            displayName: "Featured Product",
            type: "boolean",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "requirements",
            displayName: "System Requirements",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "version",
            displayName: "Version",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "licenseType",
            displayName: "License Type",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["standard", "extended", "lifetime", "subscription"],
          },
          {
            name: "status",
            displayName: "Status",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["draft", "published", "archived"],
          },
        ],
      },
      {
        displayName: "Digital Product Categories",
        apiId: "digital_product_categories",
        description: "Categories for digital products",
        fields: [
          {
            name: "name",
            displayName: "Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "slug",
            displayName: "Slug",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "image",
            displayName: "Category Image",
            type: "media",
            required: false,
            unique: false,
            relationMany: false,
          },
        ],
      },
      {
        displayName: "Licenses",
        apiId: "licenses",
        description: "License information for digital products",
        fields: [
          {
            name: "licenseKey",
            displayName: "License Key",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "product",
            displayName: "Product",
            type: "relation",
            required: true,
            unique: false,
            relationMany: false,
            relationTo: "digital-products",
          },
          {
            name: "customer",
            displayName: "Customer",
            type: "relation",
            required: true,
            unique: false,
            relationMany: false,
            relationTo: "customers",
          },
          {
            name: "issuedDate",
            displayName: "Issued Date",
            type: "date",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "expiryDate",
            displayName: "Expiry Date",
            type: "date",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "status",
            displayName: "Status",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["active", "expired", "revoked"],
          },
        ],
      },
      {
        displayName: "Downloads",
        apiId: "downloads",
        description: "Track product downloads",
        fields: [
          {
            name: "product",
            displayName: "Product",
            type: "relation",
            required: true,
            unique: false,
            relationMany: false,
            relationTo: "digital-products",
          },
          {
            name: "customer",
            displayName: "Customer",
            type: "relation",
            required: true,
            unique: false,
            relationMany: false,
            relationTo: "customers",
          },
          {
            name: "downloadDate",
            displayName: "Download Date",
            type: "date",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "ipAddress",
            displayName: "IP Address",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "userAgent",
            displayName: "User Agent",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
        ],
      },
    ],
  },
  {
    id: "ecommerce-subscription",
    name: "Subscription-Based Store",
    description: "E-commerce setup for subscriptions and recurring payments",
    category: "ecommerce",
    icon: <Calendar className="h-8 w-8" />,
    contentTypes: [
      {
        displayName: "Subscription Plans",
        apiId: "subscription_plans",
        description: "Subscription plans for your services",
        fields: [
          {
            name: "name",
            displayName: "Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "richText",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "price",
            displayName: "Price",
            type: "number",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "billingCycle",
            displayName: "Billing Cycle",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["monthly", "quarterly", "biannual", "annual"],
          },
          {
            name: "trialDays",
            displayName: "Trial Days",
            type: "number",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "features",
            displayName: "Features",
            type: "json",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "isPopular",
            displayName: "Popular Plan",
            type: "boolean",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "status",
            displayName: "Status",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["active", "inactive", "archived"],
          },
        ],
      },
      {
        displayName: "Subscriptions",
        apiId: "subscriptions",
        description: "Customer subscriptions",
        fields: [
          {
            name: "customer",
            displayName: "Customer",
            type: "relation",
            required: true,
            unique: false,
            relationMany: false,
            relationTo: "customers",
          },
          {
            name: "plan",
            displayName: "Subscription Plan",
            type: "relation",
            required: true,
            unique: false,
            relationMany: false,
            relationTo: "subscription-plans",
          },
          {
            name: "startDate",
            displayName: "Start Date",
            type: "date",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "nextBillingDate",
            displayName: "Next Billing Date",
            type: "date",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "status",
            displayName: "Status",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["active", "canceled", "past_due", "trialing", "unpaid"],
          },
          {
            name: "canceledAt",
            displayName: "Canceled At",
            type: "date",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "paymentMethod",
            displayName: "Payment Method",
            type: "json",
            required: true,
            unique: false,
            relationMany: false,
          },
        ],
      },
      {
        displayName: "Billing History",
        apiId: "billing_history",
        description: "Subscription billing history",
        fields: [
          {
            name: "subscription",
            displayName: "Subscription",
            type: "relation",
            required: true,
            unique: false,
            relationMany: false,
            relationTo: "subscriptions",
          },
          {
            name: "amount",
            displayName: "Amount",
            type: "number",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "status",
            displayName: "Status",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["paid", "failed", "pending", "refunded"],
          },
          {
            name: "billingDate",
            displayName: "Billing Date",
            type: "date",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "invoice",
            displayName: "Invoice URL",
            type: "url",
            required: false,
            unique: false,
            relationMany: false,
          },
        ],
      },
    ],
  },
  {
    id: "ecommerce-fashion",
    name: "Fashion & Clothing Store",
    description: "E-commerce setup for fashion and apparel businesses",
    category: "ecommerce",
    icon: <ShoppingBag className="h-8 w-8" />,
    contentTypes: [
      {
        displayName: "Clothing Products",
        apiId: "clothing_products",
        description: "Clothing and fashion products",
        fields: [
          {
            name: "name",
            displayName: "Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "richText",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "price",
            displayName: "Price",
            type: "number",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "salePrice",
            displayName: "Sale Price",
            type: "number",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "sku",
            displayName: "SKU",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "slug",
            displayName: "Slug",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "brand",
            displayName: "Brand",
            type: "relation",
            required: false,
            unique: false,
            relationMany: false,
            relationTo: "brands",
          },
          {
            name: "category",
            displayName: "Category",
            type: "relation",
            required: true,
            unique: false,
            relationMany: false,
            relationTo: "clothing-categories",
          },
          {
            name: "gender",
            displayName: "Gender",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["men", "women", "unisex", "kids"],
          },
          {
            name: "availableSizes",
            displayName: "Available Sizes",
            type: "select",
            required: true,
            unique: false,
            relationMany: true,
            options: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
          },
          {
            name: "availableColors",
            displayName: "Available Colors",
            type: "json",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "images",
            displayName: "Product Images",
            type: "media",
            required: true,
            unique: false,
            relationMany: true,
          },
          {
            name: "material",
            displayName: "Material",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "careInstructions",
            displayName: "Care Instructions",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "featured",
            displayName: "Featured Product",
            type: "boolean",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "status",
            displayName: "Status",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["draft", "published", "out-of-stock"],
          },
        ],
      },
      {
        displayName: "Clothing Categories",
        apiId: "clothing_categories",
        description: "Categories for clothing products",
        fields: [
          {
            name: "name",
            displayName: "Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "slug",
            displayName: "Slug",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "image",
            displayName: "Category Image",
            type: "media",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "parentCategory",
            displayName: "Parent Category",
            type: "relation",
            required: false,
            unique: false,
            relationMany: false,
            relationTo: "clothing-categories",
          },
        ],
      },
      {
        displayName: "Brands",
        apiId: "brands",
        description: "Fashion brands",
        fields: [
          {
            name: "name",
            displayName: "Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "slug",
            displayName: "Slug",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "logo",
            displayName: "Brand Logo",
            type: "media",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "featured",
            displayName: "Featured Brand",
            type: "boolean",
            required: false,
            unique: false,
            relationMany: false,
          },
        ],
      },
      {
        displayName: "Collections",
        apiId: "collections",
        description: "Seasonal or themed collections",
        fields: [
          {
            name: "name",
            displayName: "Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "slug",
            displayName: "Slug",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "richText",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "season",
            displayName: "Season",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["spring", "summer", "fall", "winter", "all-season"],
          },
          {
            name: "releaseDate",
            displayName: "Release Date",
            type: "date",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "endDate",
            displayName: "End Date",
            type: "date",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "products",
            displayName: "Collection Products",
            type: "relation",
            required: true,
            unique: false,
            relationMany: true,
            relationTo: "clothing-products",
          },
          {
            name: "bannerImage",
            displayName: "Banner Image",
            type: "media",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "active",
            displayName: "Active Collection",
            type: "boolean",
            required: false,
            unique: false,
            relationMany: false,
          },
        ],
      },
    ],
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Showcase your work with projects and skills",
    category: "portfolio",
    icon: <Image className="h-8 w-8" />,
    contentTypes: [
      {
        displayName: "Projects",
        apiId: "projects",
        description: "Portfolio projects",
        fields: [
          {
            name: "title",
            displayName: "Title",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "richText",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "slug",
            displayName: "Slug",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "images",
            displayName: "Project Images",
            type: "media",
            required: false,
            unique: false,
            relationMany: true,
          },
          {
            name: "thumbnail",
            displayName: "Thumbnail",
            type: "media",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "category",
            displayName: "Category",
            type: "relation",
            required: false,
            unique: false,
            relationMany: false,
            relationTo: "project-categories",
          },
          {
            name: "technologies",
            displayName: "Technologies",
            type: "relation",
            required: false,
            unique: false,
            relationMany: true,
            relationTo: "skills",
          },
          {
            name: "projectUrl",
            displayName: "Project URL",
            type: "url",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "featured",
            displayName: "Featured Project",
            type: "boolean",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "completionDate",
            displayName: "Completion Date",
            type: "date",
            required: false,
            unique: false,
            relationMany: false,
          },
        ],
      },
      {
        displayName: "Project Categories",
        apiId: "project-categories",
        description: "Categories for projects",
        fields: [
          {
            name: "name",
            displayName: "Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "slug",
            displayName: "Slug",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
        ],
      },
      {
        displayName: "Skills",
        apiId: "skills",
        description: "Professional skills and technologies",
        fields: [
          {
            name: "name",
            displayName: "Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "icon",
            displayName: "Icon",
            type: "media",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "proficiencyLevel",
            displayName: "Proficiency Level",
            type: "select",
            required: false,
            unique: false,
            relationMany: false,
            options: ["beginner", "intermediate", "advanced", "expert"],
          },
          {
            name: "category",
            displayName: "Category",
            type: "select",
            required: false,
            unique: false,
            relationMany: false,
            options: [
              "frontend",
              "backend",
              "database",
              "design",
              "devops",
              "other",
            ],
          },
        ],
      },
      {
        displayName: "Testimonials",
        apiId: "testimonials",
        description: "Client testimonials",
        fields: [
          {
            name: "clientName",
            displayName: "Client Name",
            type: "text",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "clientTitle",
            displayName: "Client Title",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "clientCompany",
            displayName: "Client Company",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "testimonial",
            displayName: "Testimonial",
            type: "text",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "clientAvatar",
            displayName: "Client Avatar",
            type: "media",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "rating",
            displayName: "Rating",
            type: "number",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "featured",
            displayName: "Featured Testimonial",
            type: "boolean",
            required: false,
            unique: false,
            relationMany: false,
          },
        ],
      },
    ],
  },
  {
    id: "team",
    name: "Team Directory",
    description: "Manage your team members and departments",
    category: "business",
    icon: <Users className="h-8 w-8" />,
    contentTypes: [
      {
        displayName: "Team Members",
        apiId: "team-members",
        description: "Team member profiles",
        fields: [
          {
            name: "firstName",
            displayName: "First Name",
            type: "text",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "lastName",
            displayName: "Last Name",
            type: "text",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "email",
            displayName: "Email",
            type: "email",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "title",
            displayName: "Job Title",
            type: "text",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "department",
            displayName: "Department",
            type: "relation",
            required: true,
            unique: false,
            relationMany: false,
            relationTo: "departments",
          },
          {
            name: "bio",
            displayName: "Biography",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "photo",
            displayName: "Photo",
            type: "media",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "hireDate",
            displayName: "Hire Date",
            type: "date",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "skills",
            displayName: "Skills",
            type: "text",
            required: false,
            unique: false,
            relationMany: true,
          },
          {
            name: "socialLinks",
            displayName: "Social Links",
            type: "json",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "status",
            displayName: "Status",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["active", "on-leave", "contractor", "former"],
          },
        ],
      },
      {
        displayName: "Departments",
        apiId: "departments",
        description: "Company departments",
        fields: [
          {
            name: "name",
            displayName: "Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "manager",
            displayName: "Department Manager",
            type: "relation",
            required: false,
            unique: false,
            relationMany: false,
            relationTo: "team-members",
          },
          {
            name: "parentDepartment",
            displayName: "Parent Department",
            type: "relation",
            required: false,
            unique: false,
            relationMany: false,
            relationTo: "departments",
          },
        ],
      },
    ],
  },
  {
    id: "events",
    name: "Event Management",
    description: "Manage events, schedules, and attendees",
    category: "business",
    icon: <Calendar className="h-8 w-8" />,
    contentTypes: [
      {
        displayName: "Events",
        apiId: "events",
        description: "Events and activities",
        fields: [
          {
            name: "title",
            displayName: "Event Title",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "richText",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "startDate",
            displayName: "Start Date",
            type: "date",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "endDate",
            displayName: "End Date",
            type: "date",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "location",
            displayName: "Location",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "image",
            displayName: "Event Image",
            type: "media",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "capacity",
            displayName: "Maximum Capacity",
            type: "number",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "category",
            displayName: "Category",
            type: "relation",
            required: false,
            unique: false,
            relationMany: false,
            relationTo: "event-categories",
          },
          {
            name: "organizer",
            displayName: "Organizer",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "status",
            displayName: "Status",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["scheduled", "in-progress", "completed", "cancelled"],
          },
          {
            name: "isPublic",
            displayName: "Public Event",
            type: "boolean",
            required: false,
            unique: false,
            relationMany: false,
          },
        ],
      },
      {
        displayName: "Event Categories",
        apiId: "event-categories",
        description: "Categories for events",
        fields: [
          {
            name: "name",
            displayName: "Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "color",
            displayName: "Color",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
        ],
      },
      {
        displayName: "Attendees",
        apiId: "attendees",
        description: "Event attendees",
        fields: [
          {
            name: "name",
            displayName: "Name",
            type: "text",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "email",
            displayName: "Email",
            type: "email",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "event",
            displayName: "Event",
            type: "relation",
            required: true,
            unique: false,
            relationMany: false,
            relationTo: "events",
          },
          {
            name: "registrationDate",
            displayName: "Registration Date",
            type: "date",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "status",
            displayName: "Status",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["registered", "confirmed", "attended", "cancelled"],
          },
          {
            name: "notes",
            displayName: "Notes",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
        ],
      },
    ],
  },
  {
    id: "knowledge-base",
    name: "Knowledge Base",
    description: "Create and organize helpful documentation",
    category: "blog",
    icon: <FileText className="h-8 w-8" />,
    contentTypes: [
      {
        displayName: "Articles",
        apiId: "kb-articles",
        description: "Knowledge base articles",
        fields: [
          {
            name: "title",
            displayName: "Title",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "content",
            displayName: "Content",
            type: "richText",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "slug",
            displayName: "Slug",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "category",
            displayName: "Category",
            type: "relation",
            required: true,
            unique: false,
            relationMany: false,
            relationTo: "kb-categories",
          },
          {
            name: "tags",
            displayName: "Tags",
            type: "text",
            required: false,
            unique: false,
            relationMany: true,
          },
          {
            name: "author",
            displayName: "Author",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "lastUpdated",
            displayName: "Last Updated",
            type: "date",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "status",
            displayName: "Status",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["draft", "published", "archived"],
          },
        ],
      },
      {
        displayName: "Categories",
        apiId: "kb-categories",
        description: "Knowledge base categories",
        fields: [
          {
            name: "name",
            displayName: "Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "slug",
            displayName: "Slug",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "icon",
            displayName: "Icon",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "parentCategory",
            displayName: "Parent Category",
            type: "relation",
            required: false,
            unique: false,
            relationMany: false,
            relationTo: "kb-categories",
          },
        ],
      },
      {
        displayName: "FAQs",
        apiId: "faqs",
        description: "Frequently asked questions",
        fields: [
          {
            name: "question",
            displayName: "Question",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "answer",
            displayName: "Answer",
            type: "richText",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "category",
            displayName: "Category",
            type: "relation",
            required: false,
            unique: false,
            relationMany: false,
            relationTo: "kb-categories",
          },
          {
            name: "order",
            displayName: "Display Order",
            type: "number",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "featured",
            displayName: "Featured FAQ",
            type: "boolean",
            required: false,
            unique: false,
            relationMany: false,
          },
        ],
      },
    ],
  },
  {
    id: "support-tickets",
    name: "Support Tickets",
    description: "Manage customer support requests",
    category: "business",
    icon: <MessageSquare className="h-8 w-8" />,
    contentTypes: [
      {
        displayName: "Tickets",
        apiId: "support-tickets",
        description: "Support tickets",
        fields: [
          {
            name: "ticketNumber",
            displayName: "Ticket Number",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "subject",
            displayName: "Subject",
            type: "text",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "richText",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "customer",
            displayName: "Customer",
            type: "relation",
            required: true,
            unique: false,
            relationMany: false,
            relationTo: "customers",
          },
          {
            name: "priority",
            displayName: "Priority",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["low", "medium", "high", "urgent"],
          },
          {
            name: "status",
            displayName: "Status",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: [
              "open",
              "in-progress",
              "waiting-customer",
              "resolved",
              "closed",
            ],
          },
          {
            name: "category",
            displayName: "Category",
            type: "relation",
            required: false,
            unique: false,
            relationMany: false,
            relationTo: "ticket-categories",
          },
          {
            name: "assignedTo",
            displayName: "Assigned To",
            type: "relation",
            required: false,
            unique: false,
            relationMany: false,
            relationTo: "team-members",
          },
          {
            name: "attachments",
            displayName: "Attachments",
            type: "media",
            required: false,
            unique: false,
            relationMany: true,
          },
          {
            name: "createdAt",
            displayName: "Created At",
            type: "date",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "updatedAt",
            displayName: "Updated At",
            type: "date",
            required: true,
            unique: false,
            relationMany: false,
          },
        ],
      },
      {
        displayName: "Ticket Responses",
        apiId: "ticket-responses",
        description: "Responses to support tickets",
        fields: [
          {
            name: "ticket",
            displayName: "Ticket",
            type: "relation",
            required: true,
            unique: false,
            relationMany: false,
            relationTo: "support-tickets",
          },
          {
            name: "content",
            displayName: "Response Content",
            type: "richText",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "author",
            displayName: "Author",
            type: "relation",
            required: true,
            unique: false,
            relationMany: false,
            relationTo: "team-members",
          },
          {
            name: "isCustomerResponse",
            displayName: "Customer Response",
            type: "boolean",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "attachments",
            displayName: "Attachments",
            type: "media",
            required: false,
            unique: false,
            relationMany: true,
          },
          {
            name: "createdAt",
            displayName: "Created At",
            type: "date",
            required: true,
            unique: false,
            relationMany: false,
          },
        ],
      },
      {
        displayName: "Ticket Categories",
        apiId: "ticket-categories",
        description: "Categories for support tickets",
        fields: [
          {
            name: "name",
            displayName: "Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "defaultAssignee",
            displayName: "Default Assignee",
            type: "relation",
            required: false,
            unique: false,
            relationMany: false,
            relationTo: "team-members",
          },
        ],
      },
    ],
  },
  {
    id: "developer-api",
    name: "API Documentation",
    description: "Document your APIs and endpoints",
    category: "custom",
    icon: <FileCode className="h-8 w-8" />,
    contentTypes: [
      {
        displayName: "API Endpoints",
        apiId: "api-endpoints",
        description: "API endpoints documentation",
        fields: [
          {
            name: "name",
            displayName: "Endpoint Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "path",
            displayName: "API Path",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "method",
            displayName: "HTTP Method",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["GET", "POST", "PUT", "PATCH", "DELETE"],
          },
          {
            name: "description",
            displayName: "Description",
            type: "richText",
            required: true,
            unique: false,
            relationMany: false,
          },
          {
            name: "requestBody",
            displayName: "Request Body Schema",
            type: "json",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "responseBody",
            displayName: "Response Body Schema",
            type: "json",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "parameters",
            displayName: "URL Parameters",
            type: "json",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "headers",
            displayName: "Required Headers",
            type: "json",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "apiVersion",
            displayName: "API Version",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "status",
            displayName: "Status",
            type: "select",
            required: true,
            unique: false,
            relationMany: false,
            options: ["stable", "beta", "deprecated"],
          },
        ],
      },
      {
        displayName: "API Groups",
        apiId: "api-groups",
        description: "Logical grouping of API endpoints",
        fields: [
          {
            name: "name",
            displayName: "Group Name",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "slug",
            displayName: "Slug",
            type: "text",
            required: true,
            unique: true,
            relationMany: false,
          },
          {
            name: "description",
            displayName: "Description",
            type: "text",
            required: false,
            unique: false,
            relationMany: false,
          },
          {
            name: "endpoints",
            displayName: "Endpoints",
            type: "relation",
            required: false,
            unique: false,
            relationMany: true,
            relationTo: "api-endpoints",
          },
        ],
      },
    ],
  },
];

export default function DeploymentTemplates() {
  // Default to ecommerce category when accessing this page
  const [selectedCategory, setSelectedCategory] = useState("ecommerce");
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<{
    status: "idle" | "deploying" | "success" | "error";
    message: string;
    details: string[];
  }>({
    status: "idle",
    message: "",
    details: [],
  });
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Get existing content types to check for conflicts
  const { data: existingContentTypes = [] } = useQuery({
    queryKey: ["/api/content-types"],
  });

  // Filter templates by category
  const filteredTemplates = templates.filter(
    (template) =>
      selectedCategory === "all" || template.category === selectedCategory,
  );

  // Check if template has conflicts with existing content types
  const checkTemplateConflicts = (template: any) => {
    if (!existingContentTypes || !Array.isArray(existingContentTypes))
      return [];

    const conflicts: string[] = [];
    const existingApiIds = existingContentTypes.map((ct: any) => ct.apiId);

    template.contentTypes.forEach((contentType: any) => {
      if (existingApiIds.includes(contentType.apiId)) {
        conflicts.push(contentType.apiId);
      }
    });

    return conflicts;
  };

  // Deploy template mutation
  const deployTemplateMutation = useMutation({
    mutationFn: async (template: any) => {
      setIsDeploying(true);
      setDeploymentStatus({
        status: "deploying",
        message: "Deploying template...",
        details: [],
      });

      const deploymentResults = [];

      // Deploy each content type in sequence
      for (const contentType of template.contentTypes) {
        try {
          // Using the correct apiRequest function parameters
          const response = await apiRequest("POST", "/api/content-types", contentType);

          deploymentResults.push({
            success: true,
            contentType: contentType.displayName,
            apiId: contentType.apiId,
          });

          // Update status
          setDeploymentStatus((prev) => ({
            ...prev,
            details: [
              ...prev.details,
              `✅ Successfully created ${contentType.displayName}`,
            ],
          }));
        } catch (error: any) {
          deploymentResults.push({
            success: false,
            contentType: contentType.displayName,
            apiId: contentType.apiId,
            error: error.message || "Unknown error",
          });

          // Update status
          setDeploymentStatus((prev) => ({
            ...prev,
            details: [
              ...prev.details,
              `❌ Failed to create ${contentType.displayName}: ${error.message || "Unknown error"}`,
            ],
          }));
        }
      }

      // Check overall success/failure
      const allSuccess = deploymentResults.every((result) => result.success);

      setDeploymentStatus({
        status: allSuccess ? "success" : "error",
        message: allSuccess
          ? "Template deployed successfully!"
          : "Template deployment completed with some errors.",
        details: deploymentResults.map((result) =>
          result.success
            ? `✅ Successfully created ${result.contentType}`
            : `❌ Failed to create ${result.contentType}: ${result.error}`,
        ),
      });

      return deploymentResults;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-types"] });
      toast({
        title: "Template deployed",
        description: "The template has been deployed successfully",
      });
    },
    onError: (error: any) => {
      setDeploymentStatus({
        status: "error",
        message: "Template deployment failed",
        details: [error.message || "Unknown error occurred"],
      });
      toast({
        title: "Deployment failed",
        description:
          error.message || "An error occurred while deploying the template",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDeploying(false);
    },
  });

  const handleDeployTemplate = () => {
    if (!selectedTemplate) return;

    deployTemplateMutation.mutate(selectedTemplate);
  };

  const viewContentTypes = () => {
    navigate("/content-type-builder");
  };

  return (
    <AdminLayout pageTitle="Deployment Templates">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Deployment Templates
          </h1>
          <p className="text-muted-foreground">
            Jump-start your project with pre-built content models
          </p>
        </div>
        
        {selectedCategory === "ecommerce" && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-100 dark:border-blue-800">
            <h2 className="text-xl font-semibold mb-2 text-blue-700 dark:text-blue-300 flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2" /> E-commerce Templates
            </h2>
            <p className="text-blue-700 dark:text-blue-300 mb-4">
              Quick-start your online store with these specialized e-commerce templates. Each template includes carefully designed content types with fields optimized for different business models.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
                <h3 className="font-medium text-blue-600 dark:text-blue-300">General Store</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Products, categories, customers, and orders for a traditional e-commerce business.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
                <h3 className="font-medium text-blue-600 dark:text-blue-300">Digital Products</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Downloadable products with licenses, automated delivery, and usage tracking.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
                <h3 className="font-medium text-blue-600 dark:text-blue-300">Fashion & Clothing</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Specialized for apparel with collections, sizes, colors, materials, and seasonal organization.</p>
              </div>
            </div>
          </div>
        )}

        <Tabs
          defaultValue={selectedCategory}
          onValueChange={setSelectedCategory}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Templates</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => setSelectedTemplate(template)}
                  conflicts={checkTemplateConflicts(template)}
                />
              ))}
            </div>
          </TabsContent>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-0">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => setSelectedTemplate(template)}
                    conflicts={checkTemplateConflicts(template)}
                  />
                ))}
                {filteredTemplates.length === 0 && (
                  <div className="col-span-full text-center py-10">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">
                      No templates available
                    </h3>
                    <p className="text-muted-foreground mt-2">
                      There are no templates in this category yet.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Template Details Modal */}
        {selectedTemplate && (
          <Dialog
            open={!!selectedTemplate}
            onOpenChange={(open) => !open && setSelectedTemplate(null)}
          >
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-scroll">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{selectedTemplate.icon}</span>
                  <span>{selectedTemplate.name}</span>
                </DialogTitle>
                <DialogDescription>
                  {selectedTemplate.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Conflict Warning */}
                {checkTemplateConflicts(selectedTemplate).length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <AlertTitle>Conflicts Detected</AlertTitle>
                    <AlertDescription>
                      <p>
                        This template conflicts with your existing content
                        types:
                      </p>
                      <ul className="list-disc list-inside mt-2">
                        {checkTemplateConflicts(selectedTemplate).map(
                          (conflict) => (
                            <li key={conflict}>{conflict}</li>
                          ),
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Deployment Status */}
                {deploymentStatus.status !== "idle" && (
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-md ${
                        deploymentStatus.status === "deploying"
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : deploymentStatus.status === "success"
                            ? "bg-green-50 dark:bg-green-900/20"
                            : "bg-red-50 dark:bg-red-900/20"
                      }`}
                    >
                      <h3
                        className={`text-sm font-medium flex items-center ${
                          deploymentStatus.status === "deploying"
                            ? "text-blue-800 dark:text-blue-300"
                            : deploymentStatus.status === "success"
                              ? "text-green-800 dark:text-green-300"
                              : "text-red-800 dark:text-red-300"
                        }`}
                      >
                        {deploymentStatus.status === "deploying" ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                            Deploying
                          </>
                        ) : deploymentStatus.status === "success" ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Deployment Successful
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Deployment Error
                          </>
                        )}
                      </h3>
                      <p className="mt-1 text-sm">{deploymentStatus.message}</p>
                    </div>

                    {deploymentStatus.details.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md border">
                        <div className="p-4 border-b">
                          <h4 className="text-sm font-medium">
                            Deployment Details
                          </h4>
                        </div>
                        <div className="p-4 max-h-40 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-xs">
                            {deploymentStatus.details.map((detail, index) => (
                              <div key={index} className="py-1">
                                {detail}
                              </div>
                            ))}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Content Types List */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Content Types</h3>
                  <div className="grid gap-2">
                    {selectedTemplate.contentTypes.map((contentType: any) => (
                      <div
                        key={contentType.apiId}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {contentType.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contentType.apiId}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {contentType.fields.length} Fields
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                {deploymentStatus.status === "success" ? (
                  <Button variant="default" onClick={viewContentTypes}>
                    View Content Types
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedTemplate(null);
                        setDeploymentStatus({
                          status: "idle",
                          message: "",
                          details: [],
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleDeployTemplate}
                      disabled={
                        isDeploying ||
                        checkTemplateConflicts(selectedTemplate).length > 0
                      }
                    >
                      {isDeploying ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                          Deploying...
                        </>
                      ) : (
                        <>Deploy Template</>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}

interface TemplateCardProps {
  template: any;
  onSelect: () => void;
  conflicts: string[];
}

function TemplateCard({ template, onSelect, conflicts }: TemplateCardProps) {
  const hasConflicts = conflicts.length > 0;
  const isEcommerce = template.category === "ecommerce";

  return (
    <Card className={`overflow-hidden transition-all ${
      isEcommerce ? "hover:shadow-md hover:-translate-y-1 duration-300" : "hover:shadow-sm"
    }`}>
      <CardHeader className={isEcommerce ? 
        "bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b" : 
        ""}>
        <CardTitle className="flex items-center gap-2">
          <div className={`p-2 rounded-md ${
            isEcommerce 
              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300" 
              : "bg-primary/10 text-primary"
          }`}>
            {template.icon}
          </div>
          <span>{template.name}</span>
          {isEcommerce && (
            <Badge className="ml-2 bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300">
              E-commerce
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Content Types</h4>
            <ul className="space-y-1">
              {template.contentTypes.slice(0, 5).map((contentType: any) => (
                <li
                  key={contentType.apiId}
                  className="text-sm flex items-center gap-1"
                >
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                    isEcommerce ? "bg-blue-500" : "bg-primary/60"
                  } mr-1`}></span>
                  {contentType.displayName}
                  {conflicts.includes(contentType.apiId) && (
                    <Badge
                      variant="destructive"
                      className="ml-auto text-[10px] px-1 py-0 h-4"
                    >
                      Conflict
                    </Badge>
                  )}
                </li>
              ))}
              {template.contentTypes.length > 5 && (
                <li className="text-sm text-muted-foreground italic mt-1">
                  + {template.contentTypes.length - 5} more content types
                </li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant={isEcommerce ? "default" : "outline"} 
              className="w-full"
              onClick={onSelect}
              {...(isEcommerce && {className: "w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"})}
            >
              {hasConflicts ? "View Conflicts" : (isEcommerce ? "Quick Deploy" : "Deploy Template")}
            </Button>
          </DialogTrigger>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
