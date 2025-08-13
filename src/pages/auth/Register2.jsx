import { useForm } from "react-hook-form";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaRegEyeSlash } from "react-icons/fa";
import { PiEye } from "react-icons/pi";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUploadFileMutation } from "../../features/file/fileSlice";
import { useRegisterMutation } from "../../features/auth/authSlide";

const schema = z.object({
  name: z.string().nonempty("Name is required"),
  email: z.string().nonempty("Email is required").email("Invalid email"),
  password: z
    .string()
    .nonempty("Password is required")
    .min(4, "Password must be at least 4 characters"),
});

export default function Register2() {
  const [uploadFile] = useUploadFileMutation();
  const [registerUser] = useRegisterMutation();

  const [isShowPassword, setIsShowPassword] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm({
    defaultValues: {
      name: "dara",
      email: "dara@gmail.com",
      password: "qwer",
      avatar: "",
    },
    resolver: zodResolver(schema),
  });

  // cleanup blob URL
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onPickFile = () => fileInputRef.current?.click();

  const handleImagePreview = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // validate image
    const isImage = /^image\/(png|jpe?g|webp)$/i.test(file.type);
    const under2MB = file.size <= 2 * 1024 * 1024;

    if (!isImage) {
      setError("avatar", { message: "Only JPG, PNG, or WEBP allowed" });
      return;
    }
    if (!under2MB) {
      setError("avatar", { message: "Image must be ≤ 2MB" });
      return;
    }

    clearErrors("avatar");
    setImage(file);
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      let avatarUrl = undefined;
      if (image) {
        const fd = new FormData();
        fd.append("file", image);
        const fileRes = await uploadFile(fd).unwrap();
        // NOTE: your API returns { location } or { uri } — adjust if needed:
        avatarUrl = fileRes.location || fileRes.uri;
      }

      const submitData = { ...data, avatar: avatarUrl };
      await registerUser(submitData).unwrap();

      // success UX: you can route or show a toast
      alert("Registered successfully ✅");
    } catch (e) {
      console.error(e);
      alert("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Derived UI labels
  const avatarLabel = useMemo(() => (preview ? "Change" : "Upload"), [preview]);

   return (
    <div className="min-h-[90vh] w-full flex items-center justify-center px-4 py-10 bg-gray-50 dark:bg-gray-950">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900"
      >
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Join and start managing your profile in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px,1fr]">
          {/* Avatar */}
          <div className="flex md:block justify-center">
            <div className="relative h-48 w-48">
              <button
                type="button"
                onClick={onPickFile}
                className="group relative h-48 w-48 overflow-hidden rounded-full ring-1 ring-gray-200 bg-gray-100 dark:bg-gray-800 dark:ring-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label={`${avatarLabel} profile image`}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <svg
                      className="h-10 w-10 text-gray-400 dark:text-gray-500"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M20 21a8 8 0 1 0-16 0"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/30" />
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-900 shadow-sm ring-1 ring-gray-200 backdrop-blur-sm group-hover:bg-white dark:bg-gray-800/90 dark:text-gray-100 dark:ring-gray-700">
                  {avatarLabel} photo
                </span>
              </button>
              <input
                {...register("avatar")}
                ref={fileInputRef}
                onChange={handleImagePreview}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
              />
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Full name
              </label>
              <input
                {...register("name")}
                id="name"
                type="text"
                placeholder="Enter your name"
                className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-900 dark:text-gray-100 ${
                  errors.name
                    ? "border-red-400 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <input
                {...register("email")}
                id="email"
                type="email"
                placeholder="you@example.com"
                className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-900 dark:text-gray-100 ${
                  errors.email
                    ? "border-red-400 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  id="password"
                  type={isShowPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`block w-full rounded-lg border bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-900 dark:text-gray-100 ${
                    errors.password
                      ? "border-red-400 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setIsShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {isShowPassword ? <PiEye /> : <FaRegEyeSlash />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {errors.avatar?.message && (
              <p className="mt-1 text-xs text-red-600">{errors.avatar.message}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:opacity-70 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
            >
              {submitting ? "Creating account…" : "Create account"}
            </button>

            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              By continuing, you agree to our Terms and acknowledge the Privacy Policy.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
