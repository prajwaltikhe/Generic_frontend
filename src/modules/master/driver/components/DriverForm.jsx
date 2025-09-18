import { Autocomplete, TextField } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AddressServices, ApiService } from "../../../../services";
import { APIURL } from "../../../../constants";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

const customIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const DriverForm = () => {
  // const dispatch = useDispatch();
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    punchId: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    drivingLicenceNo: "",
    drivingLicenceIssueDate: "",
    drivingLicenceExpiryDate: "",
    profilePhoto: "",
    address: "",
    latitude: "",
    longitude: "",
  });
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [addressOnSearch, setAddressOnSearch] = useState([]);
  const [selectedAddressOption, setSelectedAddressOption] = useState(null);
  const addressTimeoutRef = useRef(null);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const location = useLocation();
  const rowData = location.state;

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // setProfilePhoto(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  useEffect(() => {
    if (rowData) {
      const [firstName = "", lastName = ""] =
        rowData.driverName?.split(" ") || [];

      setFormValues({
        firstName,
        lastName,
        punchId: rowData.punchId || "",
        email: rowData.driverEmail || "",
        phoneNumber: rowData.phoneNumber || "",
        dateOfBirth: rowData.dateOfBirth || "",
        drivingLicenceNo: rowData.drivingLicenceNo || "",
        drivingLicenceIssueDate: rowData.drivingLicenceIssueDate || "",
        drivingLicenceExpiryDate: rowData.drivingLicenceExpiryDate || "",
        profilePhoto: rowData.profilePhoto || "",
        address: rowData.address || "",
        latitude: rowData.latitude || "",
        longitude: rowData.longitude || "",
      });
    }
  }, [rowData]);

  useEffect(() => {
    if (rowData) {
      const addressname = rowData.address;
      if (addressname) {
        const fakeOption = {
          label: addressname,
          value: rowData.place_id,
        };
      }
    }
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const convertFileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Data = reader.result.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    let profileImageBytes = null;

    if (formValues.profilePhoto instanceof File) {
      profileImageBytes = await convertFileToBase64(formValues.profilePhoto);
    }
    const payload = {
      first_name: formValues.firstName,
      last_name: formValues.lastName,
      punch_id: formValues.punchId ? parseInt(formValues.punchId) : null,
      email: formValues.email,
      phone_number: formValues.phoneNumber,
      date_of_birth: formValues.dateOfBirth
        ? new Date(formValues.dateOfBirth).toISOString()
        : null,
      driving_licence: formValues.drivingLicenceNo,
      driving_licence_issue_date: formValues.drivingLicenceIssueDate
        ? new Date(formValues.drivingLicenceIssueDate).toISOString()
        : null,
      driving_licence_expire_date: formValues.drivingLicenceExpiryDate
        ? new Date(formValues.drivingLicenceExpiryDate).toISOString()
        : null,
      latitude: formValues.latitude,
      longitude: formValues.longitude,
      address: formValues.address,
      status_id: 1,
    };

    if (rowData) {
      // update logic goes here
      const res = await ApiService.put(
        `${APIURL.DRIVER}/${rowData.actual_id}`,
        payload
      );

      if (res.success) {
        navigate("/master/driver");
      } else {
        alert(res.message || "Something went wrong.");
      }
    } else {
      // create logic gere
      const res = await ApiService.post(APIURL.DRIVER, payload);
      if (res.success) {
        navigate("/master/driver");
      } else {
        alert(res.message || "Something went wrong.");
      }
    }
  };

  return (
    <div className="w-full h-full p-2">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-4 text-[#07163d]">Bus Driver</h1>
      </div>

      <form onSubmit={handleFormSubmit}>
        <div className="grid grid-col-1 md:grid-cols-2 gap-3">
          <div className="bg-white rounded-sm border-t-3 border-[#07163d]">
            <h2 className="text-lg p-3 text-gray-700">Bus Driver Detail</h2>
            <hr className="border border-gray-300" />
            <div className="p-5">
              <div className="grid grid-col-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <TextField
                    size="small"
                    type="text"
                    name="firstName"
                    id="firstName"
                    fullWidth
                    required
                    placeholder="Driver First Name"
                    value={formValues.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Last Name
                  </label>
                  <TextField
                    size="small"
                    type="text"
                    name="lastName"
                    id="lastName"
                    fullWidth
                    required
                    placeholder="Last Name"
                    value={formValues.lastName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Punch Id
                  </label>
                  <TextField
                    size="small"
                    type="text"
                    name="punchId"
                    id="punchId"
                    fullWidth
                    placeholder="Punch Id"
                    value={formValues.punchId}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Email
                  </label>
                  <TextField
                    size="small"
                    type="email"
                    name="email"
                    id="email"
                    fullWidth
                    placeholder="Email"
                    value={formValues.email}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Phone Number
                  </label>
                  <TextField
                    size="small"
                    type="number"
                    name="phoneNumber"
                    id="phoneNumber"
                    fullWidth
                    placeholder="Phone Number"
                    value={formValues.phoneNumber}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Date Of Birth
                  </label>
                  <TextField
                    size="small"
                    type="date"
                    name="dateOfBirth"
                    id="dateOfBirth"
                    fullWidth
                    placeholder="Date Of Birth"
                    value={formValues.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Driving Licence No.
                  </label>
                  <TextField
                    size="small"
                    type="text"
                    name="drivingLicenceNo"
                    id="drivingLicenceNo"
                    fullWidth
                    placeholder="Driving Licence No."
                    value={formValues.drivingLicenceNo}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Driving Licence issue date
                  </label>
                  <TextField
                    size="small"
                    type="date"
                    name="drivingLicenceIssueDate"
                    id="drivingLicenceIssueDate"
                    fullWidth
                    placeholder="Driving Licence issue date"
                    value={formValues.drivingLicenceIssueDate}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Driving Licence expiry date
                  </label>
                  <TextField
                    size="small"
                    type="date"
                    name="drivingLicenceExpiryDate"
                    id="drivingLicenceExpiryDate"
                    fullWidth
                    placeholder="Driving Licence expiry date"
                    value={formValues.drivingLicenceExpiryDate}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Profile Image
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <div
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                      onClick={() => fileInputRef.current.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                          className="w-8 h-8 mb-4 text-gray-500"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 20 16"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                          />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          SVG, PNG, JPG or GIF (MAX. 800x400px)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        className="hidden"
                        name="profilePhoto"
                        id="profilePhoto"
                        // value={formValues.profilePhoto}
                        onChange={(e) => {
                          if (e.target.files.length > 0) {
                            const file = e.target.files[0];
                            setFormValues((prev) => ({
                              ...prev,
                              profilePhoto: file,
                            }));
                          }
                        }}
                      />
                    </div>
                  </div>
                  {formValues.profilePhoto && (
                    <img
                      src={
                        typeof profilePhoto === "string"
                          ? profilePhoto
                          : URL.createObjectURL(formValues.profilePhoto)
                      }
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-full border mt-3"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-sm border-t-3 border-[#07163d]">
            <h2 className="text-lg p-3 text-gray-700">Bus Driver Address</h2>
            <hr className="border border-gray-300" />
            <div className="p-5">
              <div className="grid grid-col-1 md:grid-cols-1 gap-3">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Address
                  </label>
                  <Autocomplete
                    disablePortal
                    //  disabled={isViewMode}
                    options={addressOnSearch?.map((item) => {
                      return {
                        label: item.display_name,
                        value: item.place_id,
                        otherData: item,
                      };
                    })}
                    isOptionEqualToValue={(option, value) =>
                      option.value === value
                    }
                    getOptionKey={(option) => option.value}
                    getOptionLabel={(option) => option.label}
                    size="small"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Address"
                        // error={!!errors.address}
                        // helperText={errors.address}
                      />
                    )}
                    onInputChange={(event, value) => {
                      if (addressTimeoutRef.current) {
                        clearTimeout(addressTimeoutRef.current);
                      }
                      addressTimeoutRef.current = setTimeout(async () => {
                        if (value.length > 0) {
                          const addresses =
                            await AddressServices.getLocationFromName(value);
                          if (addresses.length > 0) {
                            setAddressOnSearch(addresses);
                          }
                        }
                      }, 500);
                    }}
                    value={selectedAddressOption}
                    onChange={(event, value) => {
                      if (value) {
                        setSelectedAddressOption(value);
                        setFormValues((prev) => ({
                          ...prev,
                          address: value.otherData.display_name,
                          latitude: value.otherData.lat,
                          longitude: value.otherData.lon,
                        }));
                      }
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-col-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Latitude
                  </label>
                  <TextField
                    size="small"
                    type="text"
                    name="latitude"
                    id="latitude"
                    fullWidth
                    placeholder="Latitude"
                    value={formValues.latitude}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Longitude
                  </label>
                  <TextField
                    size="small"
                    type="text"
                    name="longitude"
                    id="longitude"
                    fullWidth
                    placeholder="Longitude"
                    value={formValues.longitude}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-col-1 md:grid-cols-1 gap-3 mt-3">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900">
                    Map <span className="text-red-500">*</span>
                  </label>
                  <div className="map w-full h-70 bg-gray-500 rounded-2xl">
                    <MapContainer
                      center={[20.5937, 78.9629]}
                      zoom={5}
                      className="w-full h-full"
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                      />
                      {formValues.latitude && formValues.longitude ? (
                        <Marker
                          key={formValues.latitude}
                          position={[
                            parseFloat(formValues.latitude),
                            parseFloat(formValues.longitude),
                          ]}
                          icon={customIcon}
                        >
                          <Popup>
                            <div>
                              <strong>{formValues.address}</strong>
                            </div>
                          </Popup>
                        </Marker>
                      ) : null}
                    </MapContainer>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="submit"
                  className="text-white bg-[#07163d] hover:bg-[#07163d]/90 focus:ring-4 focus:outline-none focus:ring-[#07163d]/30 font-medium rounded-md text-sm px-5 py-2.5 text-center cursor-pointer"
                >
                  Save
                </button>
                <Link to="/master/driver">
                  <button
                    type="button"
                    className="text-white bg-gray-500 hover:bg-gray-500/90 focus:ring-4 focus:outline-none focus:ring-gray-500/30 font-medium rounded-md text-sm px-5 py-2.5 text-center cursor-pointer"
                  >
                    Back
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DriverForm;
