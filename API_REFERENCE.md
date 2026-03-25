# Vendor & POI Management API Reference

## Quick Index

### Vendor POI Endpoints (Vendor Auth Required)

- `GET /api/vendor/pois` - List vendor's POIs
- `POST /api/vendor/pois` - Create new POI
- `GET /api/vendor/pois/:id` - View POI details
- `PATCH /api/vendor/pois/:id` - Update POI
- `DELETE /api/vendor/pois/:id` - Delete POI

### Admin POI Endpoints (Admin Auth Required)

- `GET /api/admin/pois` - List all POIs
- `GET /api/admin/pois/:id` - View POI details
- `PATCH /api/admin/pois/:id` - Approve/reject POI

---

## Vendor Endpoints

### 1. GET /api/vendor/pois

List vendor's POIs with optional filtering.

**Auth**: Vendor token (httpOnly cookie)

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | string | all | Filter: PENDING, APPROVED, REJECTED |
| take | number | 50 | Limit results (max 200) |
| skip | number | 0 | Pagination offset |

**Example Request**:

```bash
curl -X GET "http://localhost:3000/api/vendor/pois?status=PENDING&take=10" \
  -H "Cookie: fs_vendor_access_token=eyJ..."
```

**Response (200)**:

```json
{
  "total": 3,
  "pois": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Pho 99",
      "slug": "pho-99",
      "category": "FOOD",
      "latitude": 10.7769,
      "longitude": 106.7009,
      "priceMin": 40000,
      "priceMax": 100000,
      "rating": 0,
      "status": "PENDING",
      "rejectionReason": null,
      "approvedBy": null,
      "approvedAt": null,
      "submitCount": 1,
      "createdAt": "2026-03-24T10:00:00.000Z",
      "updatedAt": "2026-03-24T10:00:00.000Z",
      "_count": {
        "images": 0,
        "menuItems": 0,
        "translations": 0
      }
    }
  ],
  "take": 10,
  "skip": 0
}
```

**Errors**:

- `401` - Not logged in
- `403` - Not a vendor or account not approved

---

### 2. POST /api/vendor/pois

Create a new POI.

**Auth**: Vendor token (httpOnly cookie)

**Body** (application/json):

```json
{
  "name": "Pho Restaurant",
  "slug": "pho-restaurant",
  "category": "FOOD",
  "latitude": 10.7769,
  "longitude": 106.7009,
  "priceMin": 40000,
  "priceMax": 120000
}
```

**Validation**:

- `name`: required, 1-255 characters
- `slug`: optional string
- `category`: optional string
- `latitude`: optional number
- `longitude`: optional number
- `priceMin`: optional non-negative integer
- `priceMax`: optional non-negative integer, must be ≥ priceMin

**Example Request**:

```bash
curl -X POST "http://localhost:3000/api/vendor/pois" \
  -H "Cookie: fs_vendor_access_token=eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bánh Mỳ Thơm",
    "category": "SNACK",
    "latitude": 10.773,
    "longitude": 106.702,
    "priceMin": 20000,
    "priceMax": 50000
  }'
```

**Response (201)**:

```json
{
  "ok": true,
  "poi": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Bánh Mỳ Thơm",
    "slug": null,
    "category": "SNACK",
    "latitude": 10.773,
    "longitude": 106.702,
    "priceMin": 20000,
    "priceMax": 50000,
    "rating": 0,
    "status": "PENDING",
    "submitCount": 1,
    "createdAt": "2026-03-24T10:00:00.000Z",
    "updatedAt": "2026-03-24T10:00:00.000Z"
  }
}
```

**Errors**:

- `400` - Validation errors (invalid JSON, missing required fields)
- `401` - Not logged in
- `403` - Not a vendor or account not approved

---

### 3. GET /api/vendor/pois/:id

View a specific POI with all details.

**Auth**: Vendor token (httpOnly cookie)

**URL Parameters**:

- `id`: POI UUID

**Example Request**:

```bash
curl -X GET "http://localhost:3000/api/vendor/pois/550e8400-e29b-41d4-a716-446655440000" \
  -H "Cookie: fs_vendor_access_token=eyJ..."
```

**Response (200)**:

```json
{
  "poi": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Bánh Mỳ Thơm",
    "slug": null,
    "category": "SNACK",
    "latitude": 10.773,
    "longitude": 106.702,
    "priceMin": 20000,
    "priceMax": 50000,
    "rating": 4.5,
    "status": "REJECTED",
    "rejectionReason": "Images are too small",
    "approvedBy": null,
    "approvedAt": null,
    "submitCount": 1,
    "createdAt": "2026-03-24T10:00:00.000Z",
    "updatedAt": "2026-03-24T10:05:00.000Z",
    "images": [
      {
        "id": "...",
        "imageUrl": "https://...",
        "description": "storefront"
      }
    ],
    "menuItems": [
      {
        "id": "...",
        "name": "Bánh Mỳ Pâté",
        "description": "Classic Vietnamese banh mi",
        "price": 30000,
        "imageUrl": null,
        "isAvailable": true
      }
    ],
    "translations": [
      {
        "id": "...",
        "language": "en",
        "name": "Banh Mi Thom",
        "description": "Delicious Vietnamese sandwich",
        "audioScript": null,
        "audios": []
      }
    ]
  }
}
```

**Errors**:

- `401` - Not logged in
- `403` - Not owner of this POI or vendor not approved
- `404` - POI not found

---

### 4. PATCH /api/vendor/pois/:id

Update a POI. Only allowed if status is PENDING or REJECTED.

**Auth**: Vendor token (httpOnly cookie)

**URL Parameters**:

- `id`: POI UUID

**Body** (application/json, all fields optional):

```json
{
  "name": "Updated Name",
  "category": "FOOD",
  "latitude": 10.777,
  "longitude": 106.701,
  "priceMin": 35000,
  "priceMax": 100000
}
```

**What Happens**:

- POI status changes back to PENDING (if it was REJECTED)
- `submitCount` is incremented
- `rejectionReason` is cleared
- `approvedBy` and `approvedAt` are cleared

**Example Request**:

```bash
curl -X PATCH "http://localhost:3000/api/vendor/pois/550e8400-e29b-41d4-a716-446655440000" \
  -H "Cookie: fs_vendor_access_token=eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bánh Mỳ Thơm - Updated",
    "priceMax": 55000
  }'
```

**Response (200)**:

```json
{
  "ok": true,
  "poi": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Bánh Mỳ Thơm - Updated",
    "status": "PENDING",
    "submitCount": 2,
    "updatedAt": "2026-03-24T10:10:00.000Z"
  }
}
```

**Errors**:

- `400` - Validation errors or POI already approved
- `401` - Not logged in
- `403` - Not owner or vendor not approved
- `404` - POI not found

---

### 5. DELETE /api/vendor/pois/:id

Delete a POI. Only allowed if status is NOT APPROVED.

**Auth**: Vendor token (httpOnly cookie)

**URL Parameters**:

- `id`: POI UUID

**Example Request**:

```bash
curl -X DELETE "http://localhost:3000/api/vendor/pois/550e8400-e29b-41d4-a716-446655440000" \
  -H "Cookie: fs_vendor_access_token=eyJ..."
```

**Response (200)**:

```json
{
  "ok": true
}
```

**Errors**:

- `401` - Not logged in
- `403` - Cannot delete APPROVED POI or vendor not approved
- `404` - POI not found

---

## Admin Endpoints

### 1. GET /api/admin/pois

List all POIs with advanced filtering.

**Auth**: Admin token (httpOnly cookie)

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| q | string | none | Search by POI/vendor name/email |
| status | string | all | Filter: PENDING, APPROVED, REJECTED |
| ownerId | string | none | Filter by specific vendor ID |
| take | number | 50 | Limit results (max 200) |
| skip | number | 0 | Pagination offset |

**Example Request**:

```bash
curl -X GET "http://localhost:3000/api/admin/pois?status=PENDING&q=pho&take=20" \
  -H "Cookie: fs_admin_access_token=eyJ..."
```

**Response (200)**:

```json
{
  "total": 5,
  "pois": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Pho 99",
      "category": "FOOD",
      "latitude": 10.7769,
      "longitude": 106.7009,
      "priceMin": 40000,
      "priceMax": 100000,
      "rating": 0,
      "status": "PENDING",
      "rejectionReason": null,
      "approvedBy": null,
      "approvedAt": null,
      "submitCount": 1,
      "createdAt": "2026-03-24T10:00:00.000Z",
      "updatedAt": "2026-03-24T10:00:00.000Z",
      "owner": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Vendor Name",
        "email": "vendor@example.com"
      },
      "_count": {
        "images": 2,
        "menuItems": 5,
        "translations": 1
      }
    }
  ],
  "take": 20,
  "skip": 0
}
```

**Errors**:

- `401` - Not logged in
- `403` - Not an admin or account not approved

---

### 2. GET /api/admin/pois/:id

View a specific POI with all details (admin view).

**Auth**: Admin token (httpOnly cookie)

**URL Parameters**:

- `id`: POI UUID

**Example Request**:

```bash
curl -X GET "http://localhost:3000/api/admin/pois/550e8400-e29b-41d4-a716-446655440000" \
  -H "Cookie: fs_admin_access_token=eyJ..."
```

**Response (200)**:

```json
{
  "poi": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Pho 99",
    "status": "PENDING",
    "owner": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Vendor Name",
      "email": "vendor@example.com"
    },
    "images": [...],
    "menuItems": [...],
    "translations": [...]
  }
}
```

**Errors**:

- `401` - Not logged in
- `403` - Not an admin or account not approved
- `404` - POI not found

---

### 3. PATCH /api/admin/pois/:id

Approve or reject a POI.

**Auth**: Admin token (httpOnly cookie)

**URL Parameters**:

- `id`: POI UUID

**Body** (application/json):

```json
{
  "status": "APPROVED"
}
```

Or:

```json
{
  "status": "REJECTED",
  "rejectionReason": "Missing health permit. Please upload valid health certificate."
}
```

**Validation**:

- `status`: required, only "APPROVED" or "REJECTED"
- `rejectionReason`: required if status is "REJECTED", must be non-empty

**What Happens**:

- If APPROVED: `approvedBy` = admin ID, `approvedAt` = current time
- If APPROVED: Email sent to vendor (POI approved)
- If REJECTED: `rejectionReason` set, `approvedBy`/`approvedAt` cleared
- If REJECTED: Email sent to vendor with reason
- Only PENDING POIs can be processed (others return 400 error)

**Example Request (Approve)**:

```bash
curl -X PATCH "http://localhost:3000/api/admin/pois/550e8400-e29b-41d4-a716-446655440000" \
  -H "Cookie: fs_admin_access_token=eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"status": "APPROVED"}'
```

**Example Request (Reject)**:

```bash
curl -X PATCH "http://localhost:3000/api/admin/pois/550e8400-e29b-41d4-a716-446655440000" \
  -H "Cookie: fs_admin_access_token=eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REJECTED",
    "rejectionReason": "Images too blurry. Need clear photos of food and premises."
  }'
```

**Response (200)**:

```json
{
  "ok": true,
  "poi": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Pho 99",
    "status": "APPROVED",
    "rejectionReason": null,
    "approvedBy": "550e8400-e29b-41d4-a716-446655440002",
    "approvedAt": "2026-03-24T10:15:00.000Z",
    "owner": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Vendor Name",
      "email": "vendor@example.com"
    }
  },
  "mailSent": true
}
```

**Errors**:

- `400` - POI already processed (not PENDING) or missing rejectionReason
- `401` - Not logged in
- `403` - Not an admin or account not approved
- `404` - POI not found

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message in Vietnamese",
  "issues": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "path": ["name"],
      "message": "Tên POI không được để trống"
    }
  ]
}
```

---

## Status Codes

| Code | Meaning                                                  |
| ---- | -------------------------------------------------------- |
| 200  | Success                                                  |
| 201  | Created                                                  |
| 400  | Bad request (validation error, business logic violation) |
| 401  | Not authenticated                                        |
| 403  | Forbidden (permission denied, ownership check failed)    |
| 404  | Not found                                                |
| 500  | Server error                                             |

---

## Complete Workflow Example

### Step 1: Vendor creates POI

```bash
POST /api/vendor/pois
{
  "name": "Bánh Mỳ Tây Sơn",
  "category": "SNACK",
  "latitude": 10.773,
  "longitude": 106.702,
  "priceMin": 25000,
  "priceMax": 45000
}
# Response: poi with status=PENDING, submitCount=1
```

### Step 2: Admin views pending POIs

```bash
GET /api/admin/pois?status=PENDING
# Response: list including the new POI
```

### Step 3: Admin approves POI

```bash
PATCH /api/admin/pois/{poi_id}
{ "status": "APPROVED" }
# Response: POI with status=APPROVED, vendor receives email
```

### Step 4: Later, vendor wants to add more details

```bash
PATCH /api/vendor/pois/{poi_id}
{ "priceMax": 50000 }
# Response: POI reverts to status=PENDING, submitCount=2
```

### Step 5: Admin reviews again and rejects

```bash
PATCH /api/admin/pois/{poi_id}
{
  "status": "REJECTED",
  "rejectionReason": "Please add at least one image before approval"
}
# Response: POI with status=REJECTED, vendor receives email with reason
```

### Step 6: Vendor re-edits after seeing rejection reason

```bash
GET /api/vendor/pois/{poi_id}
# Response: poi with rejectionReason: "Please add at least one image..."

PATCH /api/vendor/pois/{poi_id}
{ "name": "Bánh Mỳ Tây Sơn Full Menu" }
# Response: POI back to PENDING, ready for admin review again
```

---

## Implementation Notes

- All vendor endpoints auto-verify `vendor.status === "APPROVED"`
- All admin endpoints auto-verify `admin.status === "APPROVED"`
- Vendor can only access/modify their own POIs
- Once POI is APPROVED, vendor cannot edit/delete (but can still add images, menus, etc.)
- All timestamps are ISO 8601 format
- All IDs are UUIDs
- Email notifications are async (won't block API response)
