import Navbar from "../Components/UniversalNavbar";
import { useState, useEffect } from "react";
import { setHours, setMinutes } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getDefaultDeadline, setDefaultDeadline } from "../api"; // Adjust path as needed

function Schedule() {
  // State for each config field's from/to dates
  const defaultDate = setHours(setMinutes(new Date(), 30), 16);

  const [draftReviewFrom, setDraftReviewFrom] = useState(defaultDate);
  const [draftReviewTo, setDraftReviewTo] = useState(defaultDate);

  const [review0From, setReview0From] = useState(defaultDate);
  const [review0To, setReview0To] = useState(defaultDate);

  const [review1From, setReview1From] = useState(defaultDate);
  const [review1To, setReview1To] = useState(defaultDate);

  const [review2From, setReview2From] = useState(defaultDate);
  const [review2To, setReview2To] = useState(defaultDate);

  const [review3From, setReview3From] = useState(defaultDate);
  const [review3To, setReview3To] = useState(defaultDate);

  const [pptApprovedFrom, setPptApprovedFrom] = useState(defaultDate);
  const [pptApprovedTo, setPptApprovedTo] = useState(defaultDate);

  const [attendanceFrom, setAttendanceFrom] = useState(defaultDate);
  const [attendanceTo, setAttendanceTo] = useState(defaultDate);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch deadlines on mount
  useEffect(() => {
    const fetchDeadlines = async () => {
      setLoading(true);
      try {
        const res = await getDefaultDeadline();
        const d = res.data.data;
        if (d) {
          if (d.draftReview) {
            setDraftReviewFrom(new Date(d.draftReview.from));
            setDraftReviewTo(new Date(d.draftReview.to));
          }
          if (d.review0) {
            setReview0From(new Date(d.review0.from));
            setReview0To(new Date(d.review0.to));
          }
          if (d.review1) {
            setReview1From(new Date(d.review1.from));
            setReview1To(new Date(d.review1.to));
          }
          if (d.review2) {
            setReview2From(new Date(d.review2.from));
            setReview2To(new Date(d.review2.to));
          }
          if (d.review3) {
            setReview3From(new Date(d.review3.from));
            setReview3To(new Date(d.review3.to));
          }
          if (d.pptApproved) {
            setPptApprovedFrom(new Date(d.pptApproved.from));
            setPptApprovedTo(new Date(d.pptApproved.to));
          }
          if (d.attendance) {
            setAttendanceFrom(new Date(d.attendance.from));
            setAttendanceTo(new Date(d.attendance.to));
          }
        }
      } catch (err) {
        setMessage("Could not fetch deadlines from backend.");
      }
      setLoading(false);
    };
    fetchDeadlines();
  }, []);

  // Save all deadlines
  const handleSaveDeadlines = async () => {
    setSaving(true);
    setMessage("");
    // Validate all intervals
    if (
      !(
        draftReviewTo > draftReviewFrom &&
        review0To > review0From &&
        review1To > review1From &&
        review2To > review2From &&
        review3To > review3From &&
        pptApprovedTo > pptApprovedFrom &&
        attendanceTo > attendanceFrom
      )
    ) {
      setMessage(
        "Please ensure all 'To' dates are after their corresponding 'From' dates."
      );
      setSaving(false);
      return;
    }
    try {
      const defaultDeadline = {
        draftReview: {
          from: draftReviewFrom.toISOString(),
          to: draftReviewTo.toISOString(),
        },
        review0: {
          from: review0From.toISOString(),
          to: review0To.toISOString(),
        },
        review1: {
          from: review1From.toISOString(),
          to: review1To.toISOString(),
        },
        review2: {
          from: review2From.toISOString(),
          to: review2To.toISOString(),
        },
        review3: {
          from: review3From.toISOString(),
          to: review3To.toISOString(),
        },
        pptApproved: {
          from: pptApprovedFrom.toISOString(),
          to: pptApprovedTo.toISOString(),
        },
        attendance: {
          from: attendanceFrom.toISOString(),
          to: attendanceTo.toISOString(),
        },
      };
      const response = await setDefaultDeadline(defaultDeadline);
      setMessage(response.data?.message || "Deadlines saved successfully!");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save deadlines.");
    }
    setSaving(false);
  };

  return (
    <>
      <Navbar showLeftMenu={true} />
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <div className="pl-40 pt-10 w-[calc(100%-10rem)] items-center">
          <div className="p-10">
            <div className="bg-white shadow-md rounded-lg p-6 border-2 ">
              <h1 className="font-semibold font-roboto mb-4 text-3xl">
                Review Schedule Management
              </h1>
              <div className="space-y-6">
                <div className="border rounded-lg shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto border-collapse border border-gray-300 text-center">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="p-3 border border-gray-300">Task</th>
                          <th className="p-3 border border-gray-300">
                            From Date
                          </th>
                          <th className="p-3 border border-gray-300">
                            To Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white">
                          <td className="p-3 border border-gray-300">
                            Draft Review
                          </td>
                          <td className="p-3 border border-gray-300 text-center">
                            <DatePicker
                              selected={draftReviewFrom}
                              onChange={setDraftReviewFrom}
                              showTimeSelect
                              dateFormat="MMMM d, yyyy h:mm aa"
                              className="text-center border-2 border-gray-400 "
                            />
                          </td>
                          <td className="p-3 border border-gray-300 text-center">
                            <DatePicker
                              selected={draftReviewTo}
                              onChange={setDraftReviewTo}
                              showTimeSelect
                              dateFormat="MMMM d, yyyy h:mm aa"
                              className="text-center border-2 border-gray-400 "
                            />
                          </td>
                        </tr>
                        <tr className="bg-white">
                          <td className="p-3 border border-gray-300">
                            Review 0
                          </td>
                          <td className="p-3 border border-gray-300 text-center">
                            <DatePicker
                              selected={review0From}
                              onChange={setReview0From}
                              showTimeSelect
                              dateFormat="MMMM d, yyyy h:mm aa"
                              className="text-center border-2 border-gray-400 "
                            />
                          </td>
                          <td className="p-3 border border-gray-300 text-center">
                            <DatePicker
                              selected={review0To}
                              onChange={setReview0To}
                              showTimeSelect
                              dateFormat="MMMM d, yyyy h:mm aa"
                              className="text-center border-2 border-gray-400 "
                            />
                          </td>
                        </tr>
                        <tr className="bg-white">
                          <td className="p-3 border border-gray-300">
                            Review 1
                          </td>
                          <td className="p-3 border border-gray-300 text-center">
                            <DatePicker
                              selected={review1From}
                              onChange={setReview1From}
                              showTimeSelect
                              dateFormat="MMMM d, yyyy h:mm aa"
                              className="text-center border-2 border-gray-400 "
                            />
                          </td>
                          <td className="p-3 border border-gray-300 text-center">
                            <DatePicker
                              selected={review1To}
                              onChange={setReview1To}
                              showTimeSelect
                              dateFormat="MMMM d, yyyy h:mm aa"
                              className="text-center border-2 border-gray-400 "
                            />
                          </td>
                        </tr>
                        <tr className="bg-white">
                          <td className="p-3 border border-gray-300">
                            Review 2
                          </td>
                          <td className="p-3 border border-gray-300 text-center">
                            <DatePicker
                              selected={review2From}
                              onChange={setReview2From}
                              showTimeSelect
                              dateFormat="MMMM d, yyyy h:mm aa"
                              className="text-center border-2 border-gray-400 "
                            />
                          </td>
                          <td className="p-3 border border-gray-300 text-center">
                            <DatePicker
                              selected={review2To}
                              onChange={setReview2To}
                              showTimeSelect
                              dateFormat="MMMM d, yyyy h:mm aa"
                              className="text-center border-2 border-gray-400 "
                            />
                          </td>
                        </tr>
                        <tr className="bg-white">
                          <td className="p-3 border border-gray-300">
                            Review 3
                          </td>
                          <td className="p-3 border border-gray-300 text-center">
                            <DatePicker
                              selected={review3From}
                              onChange={setReview3From}
                              showTimeSelect
                              dateFormat="MMMM d, yyyy h:mm aa"
                              className="text-center border-2 border-gray-400 "
                            />
                          </td>
                          <td className="p-3 border border-gray-300 text-center">
                            <DatePicker
                              selected={review3To}
                              onChange={setReview3To}
                              showTimeSelect
                              dateFormat="MMMM d, yyyy h:mm aa"
                              className="text-center border-2 border-gray-400 "
                            />
                          </td>
                        </tr>
                        <tr className="bg-white">
                          <td className="p-3 border border-gray-300">
                            PPT Approved
                          </td>
                          <td className="p-3 border border-gray-300 text-center">
                            <DatePicker
                              selected={pptApprovedFrom}
                              onChange={setPptApprovedFrom}
                              showTimeSelect
                              dateFormat="MMMM d, yyyy h:mm aa"
                              className="text-center border-2 border-gray-400 "
                            />
                          </td>
                          <td className="p-3 border border-gray-300 text-center">
                            <DatePicker
                              selected={pptApprovedTo}
                              onChange={setPptApprovedTo}
                              showTimeSelect
                              dateFormat="MMMM d, yyyy h:mm aa"
                              className="text-center border-2 border-gray-400 "
                            />
                          </td>
                        </tr>
                        <tr className="bg-white">
                          <td className="p-3 border border-gray-300">
                            Attendance
                          </td>
                          <td className="p-3 border border-gray-300 text-center">
                            <DatePicker
                              selected={attendanceFrom}
                              onChange={setAttendanceFrom}
                              showTimeSelect
                              dateFormat="MMMM d, yyyy h:mm aa"
                              className="text-center border-2 border-gray-400 "
                            />
                          </td>
                          <td className="p-3 border border-gray-300 text-center">
                            <DatePicker
                              selected={attendanceTo}
                              onChange={setAttendanceTo}
                              showTimeSelect
                              dateFormat="MMMM d, yyyy h:mm aa"
                              className="text-center border-2 border-gray-400 "
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="pt-6 flex flex-col items-center">
                  <button
                    onClick={handleSaveDeadlines}
                    className={`p-3 rounded w-48 font-sans font-semibold text-white ${
                      saving
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 transition"
                    }`}
                    disabled={saving || loading}
                  >
                    {saving ? "Saving..." : "Save All Deadlines"}
                  </button>
                  {message && (
                    <p className="mt-4 text-lg font-semibold text-blue-600">
                      {message}
                    </p>
                  )}
                  {loading && (
                    <p className="mt-4 text-lg font-semibold text-gray-600">
                      Loading deadlines...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Schedule;
