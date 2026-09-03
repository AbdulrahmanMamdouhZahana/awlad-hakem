import { type FormEvent, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { apiFetch } from "../../services/api"

interface Delivery {
  id: number
  name: string
  email: string
  phone: string
  role: "delivery"
  is_active: boolean
  email_verified_at?: string | null
  created_at?: string
}

interface DeliveryForm {
  name: string
  email: string
  phone: string
  password: string
  password_confirmation: string
}

const emptyForm: DeliveryForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  password_confirmation: "",
}

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [editingDelivery, setEditingDelivery] =
    useState<Delivery | null>(null)

  const [form, setForm] = useState<DeliveryForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  // =====================================================
  // LOAD DELIVERIES
  // =====================================================

  const loadDeliveries = async () => {
    try {
      setLoading(true)

      const data = await apiFetch("/admin/deliveries")

      setDeliveries(
        Array.isArray(data?.deliveries)
          ? data.deliveries
          : []
      )
    } catch (error) {
      console.error("LOAD DELIVERIES ERROR:", error)

      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحميل الدليفري"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDeliveries()
  }, [])

  // =====================================================
  // OPEN CREATE MODAL
  // =====================================================

  const openCreateModal = () => {
    setEditingDelivery(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const openEditModal = (delivery: Delivery) => {
    setEditingDelivery(delivery)

    setForm({
      name: delivery.name,
      email: delivery.email,
      phone: delivery.phone,
      password: "",
      password_confirmation: "",
    })

    setShowModal(true)
  }

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    setEditingDelivery(null)
    setForm(emptyForm)
  }

  // =====================================================
  // HANDLE INPUT
  // =====================================================

  const updateField = (
    field: keyof DeliveryForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  // =====================================================
  // CREATE DELIVERY
  // =====================================================

  const createDelivery = async () => {
    if (!form.name.trim()) {
      toast.error("اكتب اسم الدليفري")
      return
    }

    if (!form.email.trim()) {
      toast.error("اكتب البريد الإلكتروني")
      return
    }

    if (!form.phone.trim()) {
      toast.error("اكتب رقم الهاتف")
      return
    }

    if (form.password.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      return
    }

    if (form.password !== form.password_confirmation) {
      toast.error("كلمتا المرور غير متطابقتين")
      return
    }

    try {
      setSaving(true)

      const data = await apiFetch("/admin/deliveries", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          password_confirmation:
            form.password_confirmation,
        }),
      })

      if (data?.delivery) {
        setDeliveries((current) => [
          data.delivery,
          ...current,
        ])
      }

      toast.success(
        data?.message ||
          "تم إنشاء حساب الدليفري بنجاح"
      )

      closeModal()
    } catch (error) {
      console.error("CREATE DELIVERY ERROR:", error)

      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إنشاء الدليفري"
      )
    } finally {
      setSaving(false)
    }
  }

  // =====================================================
  // UPDATE DELIVERY
  // =====================================================

  const updateDelivery = async () => {
    if (!editingDelivery) return

    if (!form.name.trim()) {
      toast.error("اكتب اسم الدليفري")
      return
    }

    if (!form.email.trim()) {
      toast.error("اكتب البريد الإلكتروني")
      return
    }

    if (!form.phone.trim()) {
      toast.error("اكتب رقم الهاتف")
      return
    }

    try {
      setSaving(true)

      const data = await apiFetch(
        `/admin/deliveries/${editingDelivery.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
          }),
        }
      )

      if (data?.delivery) {
        setDeliveries((current) =>
          current.map((delivery) =>
            delivery.id === editingDelivery.id
              ? data.delivery
              : delivery
          )
        )
      }

      toast.success(
        data?.message ||
          "تم تحديث بيانات الدليفري"
      )

      closeModal()
    } catch (error) {
      console.error("UPDATE DELIVERY ERROR:", error)

      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحديث البيانات"
      )
    } finally {
      setSaving(false)
    }
  }

  // =====================================================
  // TOGGLE ACTIVE
  // =====================================================

  const toggleDelivery = async (
    delivery: Delivery
  ) => {
    const action = delivery.is_active
      ? "تعطيل"
      : "تفعيل"

    const confirmed = window.confirm(
      `هل أنت متأكد من ${action} حساب ${delivery.name}؟`
    )

    if (!confirmed) return

    try {
      const data = await apiFetch(
        `/admin/deliveries/${delivery.id}/toggle`,
        {
          method: "PATCH",
        }
      )

      if (data?.delivery) {
        setDeliveries((current) =>
          current.map((item) =>
            item.id === delivery.id
              ? data.delivery
              : item
          )
        )
      }

      toast.success(
        data?.message ||
          `تم ${action} حساب الدليفري`
      )
    } catch (error) {
      console.error("TOGGLE DELIVERY ERROR:", error)

      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تغيير حالة الحساب"
      )
    }
  }

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const changePassword = async (
    delivery: Delivery
  ) => {
    const password = window.prompt(
      `اكتب كلمة المرور الجديدة لـ ${delivery.name}\n\nيجب أن تكون 8 أحرف على الأقل`
    )

    if (password === null) return

    if (password.length < 8) {
      toast.error(
        "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
      )
      return
    }

    const confirmation = window.prompt(
      "أعد كتابة كلمة المرور الجديدة"
    )

    if (confirmation === null) return

    if (password !== confirmation) {
      toast.error("كلمتا المرور غير متطابقتين")
      return
    }

    try {
      await apiFetch(
        `/admin/deliveries/${delivery.id}/password`,
        {
          method: "PATCH",
          body: JSON.stringify({
            password,
            password_confirmation: confirmation,
          }),
        }
      )

      toast.success(
        "تم تغيير كلمة مرور الدليفري"
      )
    } catch (error) {
      console.error(
        "CHANGE DELIVERY PASSWORD ERROR:",
        error
      )

      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تغيير كلمة المرور"
      )
    }
  }

  // =====================================================
  // DELETE DELIVERY
  // =====================================================

  const deleteDelivery = async (
    delivery: Delivery
  ) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف حساب "${delivery.name}"؟\n\nلا يمكن التراجع عن هذه العملية.`
    )

    if (!confirmed) return

    try {
      await apiFetch(
        `/admin/deliveries/${delivery.id}`,
        {
          method: "DELETE",
        }
      )

      setDeliveries((current) =>
        current.filter(
          (item) => item.id !== delivery.id
        )
      )

      toast.success(
        "تم حذف حساب الدليفري"
      )
    } catch (error) {
      console.error("DELETE DELIVERY ERROR:", error)

      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء حذف الدليفري"
      )
    }
  }

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (editingDelivery) {
      await updateDelivery()
    } else {
      await createDelivery()
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-slate-50 p-6"
      >
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

            <p className="mt-4 text-sm font-bold text-slate-500">
              جاري تحميل الدليفري...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8"
    >
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
            إدارة الدليفري
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            إدارة حسابات الدليفري والصلاحيات والحالة
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-indigo-600
            px-5
            py-3
            text-sm
            font-black
            text-white
            shadow-lg
            shadow-indigo-600/20
            transition
            hover:bg-indigo-700
            active:scale-[0.98]
          "
        >
          <span className="text-xl leading-none">
            +
          </span>

          إضافة دليفري
        </button>
      </div>

      {/* ================================================= */}
      {/* STATS */}
      {/* ================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">
            إجمالي الدليفري
          </p>

          <p className="mt-2 text-3xl font-black text-slate-900">
            {deliveries.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">
            الحسابات النشطة
          </p>

          <p className="mt-2 text-3xl font-black text-emerald-600">
            {
              deliveries.filter(
                (delivery) =>
                  delivery.is_active
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">
            الحسابات المعطلة
          </p>

          <p className="mt-2 text-3xl font-black text-red-600">
            {
              deliveries.filter(
                (delivery) =>
                  !delivery.is_active
              ).length
            }
          </p>
        </div>
      </div>

      {/* ================================================= */}
      {/* TABLE */}
      {/* ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {deliveries.length === 0 ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-4xl">
              🚚
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-900">
              لا يوجد دليفري حتى الآن
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              قم بإضافة أول حساب دليفري من خلال زر
              "إضافة دليفري".
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
            >
              إضافة أول دليفري
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-right">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-black text-slate-500">
                    الدليفري
                  </th>

                  <th className="px-5 py-4 text-xs font-black text-slate-500">
                    البريد الإلكتروني
                  </th>

                  <th className="px-5 py-4 text-xs font-black text-slate-500">
                    الهاتف
                  </th>

                  <th className="px-5 py-4 text-xs font-black text-slate-500">
                    الحالة
                  </th>

                  <th className="px-5 py-4 text-xs font-black text-slate-500">
                    تاريخ الإنشاء
                  </th>

                  <th className="px-5 py-4 text-xs font-black text-slate-500">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {deliveries.map((delivery) => (
                  <tr
                    key={delivery.id}
                    className="transition hover:bg-slate-50"
                  >
                    {/* NAME */}

                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg">
                          🚚
                        </div>

                        <div>
                          <p className="font-black text-slate-900">
                            {delivery.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            ID #{delivery.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* EMAIL */}

                    <td className="px-5 py-5">
                      <span className="text-sm font-medium text-slate-600">
                        {delivery.email}
                      </span>
                    </td>

                    {/* PHONE */}

                    <td className="px-5 py-5">
                      <span
                        dir="ltr"
                        className="text-sm font-bold text-slate-700"
                      >
                        {delivery.phone}
                      </span>
                    </td>

                    {/* STATUS */}

                    <td className="px-5 py-5">
                      {delivery.is_active ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          نشط
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-700">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          معطل
                        </span>
                      )}
                    </td>

                    {/* CREATED */}

                    <td className="px-5 py-5">
                      <span className="text-sm text-slate-500">
                        {delivery.created_at
                          ? new Date(
                              delivery.created_at
                            ).toLocaleDateString(
                              "ar-EG"
                            )
                          : "-"}
                      </span>
                    </td>

                    {/* ACTIONS */}

                    <td className="px-5 py-5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(
                              delivery
                            )
                          }
                          className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-200"
                        >
                          تعديل
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleDelivery(
                              delivery
                            )
                          }
                          className={
                            delivery.is_active
                              ? "rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
                              : "rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                          }
                        >
                          {delivery.is_active
                            ? "تعطيل"
                            : "تفعيل"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            changePassword(
                              delivery
                            )
                          }
                          className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-100"
                        >
                          Password
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteDelivery(
                              delivery
                            )
                          }
                          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white transition hover:bg-red-700"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================================================= */}
      {/* MODAL */}
      {/* ================================================= */}

      {showModal && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={closeModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {editingDelivery
                    ? "تعديل الدليفري"
                    : "إضافة دليفري جديد"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingDelivery
                    ? "تعديل بيانات حساب الدليفري"
                    : "إنشاء حساب جديد للدليفري"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  اسم الدليفري
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="مثال: أحمد محمد"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-3
                    text-sm
                    outline-none
                    transition
                    focus:border-indigo-500
                    focus:ring-4
                    focus:ring-indigo-500/10
                  "
                />
              </div>

              {/* EMAIL */}

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  البريد الإلكتروني
                </label>

                <input
                  type="email"
                  dir="ltr"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value
                    )
                  }
                  placeholder="delivery@example.com"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-3
                    text-sm
                    outline-none
                    transition
                    focus:border-indigo-500
                    focus:ring-4
                    focus:ring-indigo-500/10
                  "
                />
              </div>

              {/* PHONE */}

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  رقم الهاتف
                </label>

                <input
                  type="tel"
                  dir="ltr"
                  value={form.phone}
                  onChange={(event) =>
                    updateField(
                      "phone",
                      event.target.value
                    )
                  }
                  placeholder="01xxxxxxxxx"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-3
                    text-sm
                    outline-none
                    transition
                    focus:border-indigo-500
                    focus:ring-4
                    focus:ring-indigo-500/10
                  "
                />
              </div>

              {/* PASSWORD - CREATE ONLY */}

              {!editingDelivery && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      كلمة المرور
                    </label>

                    <input
                      type="password"
                      dir="ltr"
                      value={form.password}
                      onChange={(event) =>
                        updateField(
                          "password",
                          event.target.value
                        )
                      }
                      placeholder="8 أحرف على الأقل"
                      className="
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        py-3
                        text-sm
                        outline-none
                        transition
                        focus:border-indigo-500
                        focus:ring-4
                        focus:ring-indigo-500/10
                      "
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      تأكيد كلمة المرور
                    </label>

                    <input
                      type="password"
                      dir="ltr"
                      value={
                        form.password_confirmation
                      }
                      onChange={(event) =>
                        updateField(
                          "password_confirmation",
                          event.target.value
                        )
                      }
                      placeholder="أعد كتابة كلمة المرور"
                      className="
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        py-3
                        text-sm
                        outline-none
                        transition
                        focus:border-indigo-500
                        focus:ring-4
                        focus:ring-indigo-500/10
                      "
                    />
                  </div>
                </>
              )}

              {/* NOTE */}

              {!editingDelivery && (
                <div className="rounded-xl bg-indigo-50 p-4 text-sm leading-6 text-indigo-700">
                  حساب الدليفري سيتم إنشاؤه كـ
                  <strong className="mx-1">
                    Delivery
                  </strong>
                  وسيكون نشطًا تلقائيًا.
                </div>
              )}

              {/* ACTIONS */}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "جاري الحفظ..."
                    : editingDelivery
                      ? "حفظ التعديلات"
                      : "إنشاء الحساب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}