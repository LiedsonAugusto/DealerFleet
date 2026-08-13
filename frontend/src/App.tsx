import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { DealerDetailPage } from '@/pages/dealers/dealer-detail-page'
import { DealerFormPage } from '@/pages/dealers/dealer-form-page'
import { DealerListPage } from '@/pages/dealers/dealer-list-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { VehicleFormPage } from '@/pages/vehicles/vehicle-form-page'
import { VehicleListPage } from '@/pages/vehicles/vehicle-list-page'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/vehicles" replace />} />

        <Route path="vehicles">
          <Route index element={<VehicleListPage />} />
          <Route path="new" element={<VehicleFormPage />} />
          <Route path=":id/edit" element={<VehicleFormPage />} />
        </Route>

        <Route path="dealers">
          <Route index element={<DealerListPage />} />
          <Route path="new" element={<DealerFormPage />} />
          <Route path=":id" element={<DealerDetailPage />} />
          <Route path=":id/edit" element={<DealerFormPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
