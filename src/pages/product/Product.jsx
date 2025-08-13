import React, { useEffect, useRef, useState, useMemo } from "react";
import DataTable from "react-data-table-component";
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetProductsQuery,
} from "../../features/product/productSlice2";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useForm } from "react-hook-form";
import { useUploadFileMutation } from "../../features/file/fileSlice";
import "flowbite";

export default function Product() {
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [previewProduct, setPreviewProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm();

  const [totalData, setTotalData] = useState(10);
  const { data: productsData, isLoading, refetch } = useGetProductsQuery({
    page: 0,
    size: totalData,
  });

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (productsData?.totalElements) {
      setTotalData(productsData.totalElements);
    }
  }, [productsData]);

  const [uploadFile] = useUploadFileMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const handleUpdate = (row) => {
    setValue("name", row.name);
    setValue("description", row.description || "");
    setValue("priceIn", row.priceIn || 0);
    setValue("priceOut", row.priceOut || 0);
    setValue("discount", row.discount || 0);
    setPreview(row.thumbnail || null);
    setImage(null);
    setShowModal(true);
    toast.info(`Loaded ${row.name} into form. (Demo Update flow)`);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete "${row.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct({ uuid: row.uuid }).unwrap();
      toast.success(`${row.name} deleted successfully!`);
      refetch();
    } catch {
      toast.error(`Failed to delete ${row.name}`);
    }
  };

  const handleImagePreview = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImage(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      return;
    }
    setImage(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  };

  const fileInputRef = useRef();

  const handleModalClose = () => {
    setShowModal(false);
    reset();
    setImage(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const handleCreateProduct = async (data) => {
    try {
      let thumbnailUri = null;

      if (image) {
        const formdata = new FormData();
        formdata.append("files", image);
        const fileRes = await uploadFile(formdata).unwrap();
        thumbnailUri = fileRes.uri;
      } else if (preview) {
        thumbnailUri = preview;
      } else {
        toast.error("Please select an image");
        return;
      }

      await createProduct({
        createProduct: {
          name: data.name,
          description: data.description,
          priceIn: Number(data.priceIn),
          priceOut: Number(data.priceOut),
          discount: Number(data.discount),
          thumbnail: thumbnailUri,
          computerSpec: {
            processor: "N/A",
            ram: "N/A",
            storage: "N/A",
            gpu: "N/A",
            os: "N/A",
            screenSize: "N/A",
            battery: "N/A",
          },
          stockQuantity: 0,
          color: [],
          warranty: "",
          availability: true,
          images: [],
          categoryUuid: "eb115ca4-a6b2-43f7-aa59-2def7e30dd7b",
          supplierUuid: "fd9d42e3-3afc-43a8-8eb4-7cb4c1c9b411",
          brandUuid: "8620f990-ef33-495c-b38c-236da90c9b46",
        },
      }).unwrap();

      toast.success("Product saved!");
      handleModalClose();
      refetch();
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to save product");
    }
  };

  const filteredRows = useMemo(() => {
    const rows = productsData?.content || [];
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        String(r.priceOut)?.toLowerCase().includes(q)
    );
  }, [productsData, search]);

  const columns = [
    {
      name: "Product",
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3 min-w-[220px]">
          <img
            src={row.thumbnail}
            alt={row.name}
            className="w-12 h-12 rounded border object-contain bg-white"
            onError={(e) => {
              e.currentTarget.src = "/placeholder-image.png";
            }}
          />
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">{row.name}</div>
            <div className="text-xs text-gray-500 truncate max-w-[220px]">
              {row.description}
            </div>
          </div>
        </div>
      ),
    },
    {
      name: "Price",
      selector: (row) => row.priceOut,
      sortable: true,
      right: true,
      cell: (row) => <span>${Number(row.priceOut).toFixed(2)}</span>,
    },
    {
      name: "Stock",
      selector: (row) => row.stockQuantity,
      sortable: true,
      right: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex gap-2">
          <button
            className="inline-flex items-center px-3 py-2 text-xs font-medium text-center text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 focus:ring-4 focus:outline-none focus:ring-yellow-200"
            onClick={() => handleUpdate(row)}
          >
            Edit
          </button>
          <button
            className="inline-flex items-center px-3 py-2 text-xs font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-200"
            onClick={() => handleDelete(row)}
          >
            Delete
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  const customStyles = {
    headCells: {
      style: { fontWeight: 700, fontSize: "0.85rem" },
    },
    rows: {
      style: { minHeight: "64px" },
    },
  };

  return (
    <main className="max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4">
      <ToastContainer position="top-right" />

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Manage your inventory, add new products, and update details.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="w-4 h-4 text-gray-500"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 pl-9 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Create */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-60"
            disabled={isCreating}
          >
            <svg
              className="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {isCreating ? "Saving..." : "New Product"}
          </button>
        </div>
      </div>

      {/* Table (wrap with overflow for small screens) */}
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[640px]">
            <DataTable
              columns={columns}
              data={filteredRows}
              progressPending={isLoading}
              pagination
              highlightOnHover
              pointerOnHover
              onRowClicked={(row) => setPreviewProduct(row)}
              customStyles={customStyles}
              responsive
              dense
              noDataComponent={
                <div className="py-10 text-center text-sm text-gray-500">
                  No products found. Try a different search.
                </div>
              }
            />
          </div>
        </div>
      </section>

      {/* Quick Preview Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-2 sm:p-4">
          <div className="w-full max-w-[95vw] sm:max-w-md rounded-lg bg-white shadow">
            <div className="flex items-center justify-between border-b px-3 sm:px-4 py-3">
              <h3 className="text-base sm:text-lg font-semibold">{previewProduct.name}</h3>
              <button
                className="rounded p-2 hover:bg-gray-100"
                onClick={() => setPreviewProduct(null)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 p-3 sm:p-4">
              <img
                src={previewProduct.thumbnail}
                alt={previewProduct.name}
                className="w-full h-40 sm:h-44 object-contain rounded border"
                onError={(e) => (e.currentTarget.src = "/placeholder-image.png")}
              />
              <p className="text-sm text-gray-700">{previewProduct.description}</p>
              <div className="text-sm">
                <span className="font-semibold">Price:</span>{" "}
                ${Number(previewProduct.priceOut).toFixed(2)}
              </div>
              <div className="text-sm">
                <span className="font-semibold">Stock:</span>{" "}
                {previewProduct.stockQuantity}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-end border-t px-3 sm:px-4 py-3">
              <button
                className="w-full sm:w-auto rounded-lg bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
                onClick={() => setPreviewProduct(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-2 sm:p-4">
          <div className="w-full max-w-[96vw] sm:max-w-2xl rounded-lg bg-white shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 sm:px-6 py-4">
              <h3 className="text-base sm:text-lg font-semibold">
                {image || preview ? "Save Product" : "Create Product"}
              </h3>
              <button
                className="rounded p-2 hover:bg-gray-100"
                onClick={handleModalClose}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit(handleCreateProduct)} className="px-4 sm:px-6 py-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="col-span-1">
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Name
                  </label>
                  <input
                    className={`block w-full rounded-lg border p-2.5 text-sm ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    } focus:border-blue-500 focus:ring-blue-500`}
                    placeholder="Product name"
                    {...register("name", { required: "Name is required" })}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={`block w-full rounded-lg border p-2.5 text-sm ${
                      errors.discount ? "border-red-500" : "border-gray-300"
                    } focus:border-blue-500 focus:ring-blue-500`}
                    placeholder="0"
                    {...register("discount", {
                      required: "Discount is required",
                      min: { value: 0, message: "Must be 0 or more" },
                      max: { value: 100, message: "Cannot exceed 100%" },
                    })}
                  />
                  {errors.discount && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.discount.message}
                    </p>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Price In
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className={`block w-full rounded-lg border p-2.5 text-sm ${
                      errors.priceIn ? "border-red-500" : "border-gray-300"
                    } focus:border-blue-500 focus:ring-blue-500`}
                    placeholder="0.00"
                    {...register("priceIn", {
                      required: "Price In is required",
                      min: { value: 0, message: "Must be positive" },
                    })}
                  />
                  {errors.priceIn && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.priceIn.message}
                    </p>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Price Out
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className={`block w-full rounded-lg border p-2.5 text-sm ${
                      errors.priceOut ? "border-red-500" : "border-gray-300"
                    } focus:border-blue-500 focus:ring-blue-500`}
                    placeholder="0.00"
                    {...register("priceOut", {
                      required: "Price Out is required",
                      min: { value: 0, message: "Must be positive" },
                    })}
                  />
                  {errors.priceOut && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.priceOut.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className={`block w-full rounded-lg border p-2.5 text-sm ${
                      errors.description ? "border-red-500" : "border-gray-300"
                    } focus:border-blue-500 focus:ring-blue-500`}
                    placeholder="Write a short description..."
                    {...register("description", {
                      required: "Description is required",
                    })}
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Thumbnail
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImagePreview}
                    className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm focus:border-blue-500 focus:ring-blue-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white hover:file:bg-blue-700"
                  />
                  {!image && !preview && (
                    <p className="mt-1 text-xs text-red-600">Image is required</p>
                  )}

                  {preview && (
                    <div className="mt-3 flex justify-start">
                      <img
                        className="h-28 w-28 sm:h-32 sm:w-32 rounded border object-cover"
                        src={preview}
                        alt="preview"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-end border-t pt-4">
                <button
                  type="button"
                  className="w-full sm:w-auto rounded-lg bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
                  onClick={handleModalClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-60"
                >
                  {isCreating ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
