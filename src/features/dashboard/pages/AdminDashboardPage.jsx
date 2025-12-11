import React from "react";
import {
  MoreVertical,
  CalendarDays,
  ChevronRight,
  FileBarChart2,
  HelpCircle,
  ArrowDownRight,
  ArrowUpRight,
  MoreHorizontal,
  Star,
  CheckCircle2,
  CheckCircle,
  Dot,
  Info,
} from "lucide-react";

import StudentEnrollmentChart from "./Graphs/charts";
import TotalSalesChart from "./Graphs/TotalSalesChart";
import ThisWeekChart from "./Graphs/ThisWeekChart";
import TopCoursesChart from "./Graphs/TopCategoriesChart";
import ActiveStudentsChart from "./Graphs/ActiveStudentsChart";
import TrafficSourcesChart, { trafficData } from "./Graphs/TrafficSourcesChart";

import "./dashboard-premium-final.css";

function AdminDashboardPage() {
  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            {/* ====================== PAGE HEADER ======================= */}
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">Dashboard</h3>
                  <div className="nk-block-des text-soft">
                    <p>Welcome to Learning Management Dashboard.</p>
                  </div>
                </div>

                <div className="nk-block-head-content">
                  <div className="toggle-wrap nk-block-tools-toggle">
                    <a
                      href="#"
                      className="btn btn-icon btn-trigger toggle-expand me-n1"
                      data-target="pageMenu"
                    >
                      <MoreVertical className="icon vp-icon" />
                    </a>

                    <div className="toggle-expand-content" data-content="pageMenu">
                      <ul className="nk-block-tools g-3">
                        <li>
                          <div className="dropdown">
                            <a
                              href="#"
                              className="dropdown-toggle btn btn-white btn-dim btn-outline-light"
                              data-bs-toggle="dropdown"
                            >
                              <CalendarDays className="d-none d-sm-inline icon vp-icon me-1" />
                              <span>
                                <span className="d-none d-md-inline">Last</span> 30 Days
                              </span>
                              <ChevronRight className="dd-indc icon vp-icon ms-1" />
                            </a>
                            <div className="dropdown-menu dropdown-menu-end">
                              <ul className="link-list-opt no-bdr">
                                <li>
                                  <a href="#">
                                    <span>Last 30 Days</span>
                                  </a>
                                </li>
                                <li>
                                  <a href="#">
                                    <span>Last 6 Months</span>
                                  </a>
                                </li>
                                <li>
                                  <a href="#">
                                    <span>Last 1 Years</span>
                                  </a>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </li>

                        <li className="nk-block-tools-opt">
                          <a href="#" className="btn btn-primary">
                            <FileBarChart2 className="icon vp-icon me-1" />
                            <span>Reports</span>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ====================== DASHBOARD CONTENT ======================= */}
            <div className="nk-block">
              <div className="row g-gs">
                {/* LEFT SIDE: ENROLLMENT + SALES + WEEK */}
                <div className="col-xxl-6">
                  <div className="row g-gs">
                    {/* Students Enrollment */}
                    <div className="col-md-12">
                      <div className="card premium-card">
                        <div className="card-inner">
                          <div className="card-title-group align-start mb-2">
                            <div className="card-title">
                              <h6 className="title">Students Enrolement</h6>
                              <p>In last 30 days enrolement of students</p>
                            </div>
                            <div className="card-tools">
                              <HelpCircle
                                className="card-hint icon vp-icon"
                                data-bs-toggle="tooltip"
                                data-bs-placement="left"
                                title="Students Enrolement"
                              />
                            </div>
                          </div>

                          <div className="align-end gy-3 gx-5 flex-wrap flex-md-nowrap flex-lg-wrap flex-xxl-nowrap">
                            <div className="nk-sale-data-group flex-md-nowrap g-4">
                              <div className="nk-sale-data">
                                <span className="amount">
                                  78{" "}
                                  <span className="change down text-danger">
                                    <ArrowDownRight className="icon vp-icon me-1" />
                                    16.93%
                                  </span>
                                </span>
                                <span className="sub-title">This Month</span>
                              </div>
                              <div className="nk-sale-data">
                                <span className="amount">
                                  21{" "}
                                  <span className="change up text-success">
                                    <ArrowUpRight className="icon vp-icon me-1" />
                                    4.26%
                                  </span>
                                </span>
                                <span className="sub-title">This Week</span>
                              </div>
                            </div>

                            <div
                              className="nk-sales-ck sales-revenue"
                              style={{ width: "100%", height: 160 }}
                            >
                              <StudentEnrollmentChart />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Total Sales */}
                    <div className="col-md-6">
                      <div className="card premium-card">
                        <div className="nk-ecwg nk-ecwg3">
                          <div className="card-inner pb-0">
                            <div className="card-title-group">
                              <div className="card-title">
                                <h6 className="title">Total Sales</h6>
                              </div>
                            </div>
                            <div className="data">
                              <div className="data-group">
                                <div className="amount fw-normal">₹9,495.20</div>
                                <div className="info text-end">
                                  <span className="change up text-danger">
                                    <ArrowUpRight className="icon vp-icon me-1" />
                                    4.63%
                                  </span>
                                  <br />
                                  <span>vs. last month</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="nk-ecwg3-ck">
                            <div
                              className="nk-sales-ck"
                              style={{
                                width: "100%",
                                height: "80px",
                                overflow: "hidden",
                                borderRadius: "0 0 16px 16px",
                              }}
                            >
                              <TotalSalesChart />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* This Week So Far */}
                    <div className="col-md-6">
                      <div className="card premium-card">
                        <div className="nk-ecwg nk-ecwg3">
                          <div className="card-inner pb-0">
                            <div className="card-title-group">
                              <div className="card-title">
                                <h6 className="title">This week so far</h6>
                              </div>
                            </div>
                            <div className="data">
                              <div className="data-group">
                                <div className="amount fw-normal">₹2,995.81</div>
                                <div className="info text-end">
                                  <span className="change up text-danger">
                                    <ArrowUpRight className="icon vp-icon me-1" />
                                    7.13%
                                  </span>
                                  <br />
                                  <span>vs. last week</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="nk-ecwg3-ck">
                            <div
                              className="nk-sales-ck"
                              style={{
                                width: "100%",
                                height: "80px",
                                overflow: "hidden",
                                borderRadius: "0 0 16px 16px",
                              }}
                            >
                              <ThisWeekChart />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* TOP CATEGORIES */}
                <div className="col-lg-6">
                  <div className="card card-full premium-card">
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-4">
                        <div className="card-title">
                          <h6 className="title mb-1">Top Categories</h6>
                          <p>In last 15 days buy and sells overview.</p>
                        </div>
                        <div className="card-tools">
                          <div className="dropdown">
                            <a
                              href="#"
                              className="dropdown-toggle btn btn-icon btn-trigger"
                              data-bs-toggle="dropdown"
                            >
                              <MoreHorizontal className="icon vp-icon" />
                            </a>
                            <div className="dropdown-menu dropdown-menu-sm dropdown-menu-end">
                              <ul className="link-list-opt no-bdr">
                                <li>
                                  <a href="#" className="active">
                                    <span>15 Days</span>
                                  </a>
                                </li>
                                <li>
                                  <a href="#">
                                    <span>30 Days</span>
                                  </a>
                                </li>
                                <li>
                                  <a href="#">
                                    <span>3 Months</span>
                                  </a>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex">
                        <div className="h-300px mt-n2 flex-grow-1">
                          <TopCoursesChart />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TOP COURSES */}
                <div className="col-md-6 col-xxl-4">
                  <div className="card h-100 premium-card">
                    <div className="card-inner">
                      <div className="card-title-group mb-2">
                        <div className="card-title">
                          <h6 className="title">Top Courses</h6>
                        </div>
                        <div className="card-tools">
                          <div className="dropdown">
                            <a
                              href="#"
                              className="dropdown-toggle link link-light link-sm dropdown-indicator"
                              data-bs-toggle="dropdown"
                            >
                              Weekly
                            </a>
                            <div className="dropdown-menu dropdown-menu-sm dropdown-menu-end">
                              <ul className="link-list-opt no-bdr">
                                <li>
                                  <a href="#">
                                    <span>Daily</span>
                                  </a>
                                </li>
                                <li>
                                  <a href="#" className="active">
                                    <span>Weekly</span>
                                  </a>
                                </li>
                                <li>
                                  <a href="#">
                                    <span>Monthly</span>
                                  </a>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <ul className="nk-top-products">
                        <li className="item">
                          <div className="user-avatar sq bg-success-dim me-3">
                            <span>KS</span>
                          </div>
                          <div className="info">
                            <div className="title">Full Stack Development</div>
                            <div className="price">₹999.00</div>
                          </div>
                          <div className="total">
                            <div className="amount">₹38,961.00</div>
                            <div className="count">25 Sold</div>
                          </div>
                        </li>

                        <li className="item">
                          <div className="user-avatar sq bg-warning-dim me-3">
                            <span>HP</span>
                          </div>
                          <div className="info">
                            <div className="title">Android App Development</div>
                            <div className="price">₹11,999.00</div>
                          </div>
                          <div className="total">
                            <div className="amount">₹59,995.00</div>
                            <div className="count">5 Sold</div>
                          </div>
                        </li>

                        <li className="item">
                          <div className="user-avatar sq bg-danger-dim me-3">
                            <span>RK</span>
                          </div>
                          <div className="info">
                            <div className="title">iOS Development</div>
                            <div className="price">₹999.00</div>
                          </div>
                          <div className="total">
                            <div className="amount">₹14,985.00</div>
                            <div className="count">15 Sold</div>
                          </div>
                        </li>

                        <li className="item">
                          <div className="user-avatar sq bg-primary-dim me-3">
                            <span>PR</span>
                          </div>
                          <div className="info">
                            <div className="title">Machine Learning</div>
                            <div className="price">₹29,999.00</div>
                          </div>
                          <div className="total">
                            <div className="amount">₹59,998.00</div>
                            <div className="count">2 Sold</div>
                          </div>
                        </li>

                        <li className="item">
                          <div className="user-avatar sq bg-info-dim me-3">
                            <span>RD</span>
                          </div>
                          <div className="info">
                            <div className="title">React & Redux</div>
                            <div className="price">₹999.00</div>
                          </div>
                          <div className="total">
                            <div className="amount">₹9,990.00</div>
                            <div className="count">10 Sold</div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* TOP INSTRUCTORS */}
                <div className="col-md-6 col-xxl-4">
                  <div className="card card-full premium-card">
                    <div className="card-inner-group">
                      <div className="card-inner">
                        <div className="card-title-group">
                          <div className="card-title">
                            <h6 className="title">Top Instructors</h6>
                          </div>
                          <div className="card-tools">
                            <a href="#" className="link">
                              View All
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Instructor 1 */}
                      <div className="card-inner card-inner-md">
                        <div className="review-item d-flex justify-content-between">
                          <div className="user-card">
                            <div className="user-avatar bg-primary-dim">
                              <span>KS</span>
                            </div>
                            <div className="user-info">
                              <span className="lead-text">Keerthan Sai</span>
                              <span className="sub-text">keerthan@vidhyapat.com</span>
                            </div>
                          </div>
                          <div className="review-status">
                            <div className="d-flex align-items-center gap-1">
                              <Star className="icon vp-icon text-warning" />
                              <Star className="icon vp-icon text-warning" />
                              <Star className="icon vp-icon text-warning" />
                              <Star className="icon vp-icon text-warning" />
                              <Star className="icon vp-icon text-warning" />
                            </div>
                            <div className="review-count">128 Reviews</div>
                          </div>
                        </div>
                      </div>

                      {/* Instructor 2 */}
                      <div className="card-inner card-inner-md">
                        <div className="review-item d-flex justify-content-between">
                          <div className="user-card">
                            <div className="user-avatar bg-info-dim">
                              <span>HP</span>
                            </div>
                            <div className="user-info">
                              <span className="lead-text">Hari Prasad</span>
                              <span className="sub-text">hari@vidhyapat.com</span>
                            </div>
                          </div>
                          <div className="review-status">
                            <div className="d-flex align-items-center gap-1">
                              <Star className="icon vp-icon text-warning" />
                              <Star className="icon vp-icon text-warning" />
                              <Star className="icon vp-icon text-warning" />
                              <Star className="icon vp-icon text-warning" />
                              <Star className="icon vp-icon text-warning opacity-50" />
                            </div>
                            <div className="review-count">94 Reviews</div>
                          </div>
                        </div>
                      </div>

                      {/* Instructor 3 */}
                      <div className="card-inner card-inner-md">
                        <div className="review-item d-flex justify-content-between">
                          <div className="user-card">
                            <div className="user-avatar bg-warning-dim">
                              <span>RK</span>
                            </div>
                            <div className="user-info">
                              <span className="lead-text">Revanth Kumar</span>
                              <span className="sub-text">revanth@vidhyapat.com</span>
                            </div>
                          </div>
                          <div className="review-status">
                            <div className="d-flex align-items-center gap-1">
                              <Star className="icon vp-icon text-warning" />
                              <Star className="icon vp-icon text-warning" />
                              <Star className="icon vp-icon text-warning" />
                              <Star className="icon vp-icon text-warning" />
                              <Star className="icon vp-icon text-warning opacity-50" />
                            </div>
                            <div className="review-count">76 Reviews</div>
                          </div>
                        </div>
                      </div>

                      {/* Instructor 4 */}
                      <div className="card-inner card-inner-md">
                        <div className="review-item d-flex justify-content-between">
                          <div className="user-card">
                            <div className="user-avatar bg-pink-dim">
                              <span>PR</span>
                            </div>
                            <div className="user-info">
                              <span className="lead-text">Priya Reddy</span>
                              <span className="sub-text">priya@vidhyapat.com</span>
                            </div>
                          </div>
                          <div className="review-status">
                            <div className="d-flex align-items-center gap-1">
                              <Star className="icon vp-icon text-warning" />
                              <Star className="icon vp-icon text-warning" />
                              <Star className="icon vp-icon text-warning" />
                              <Star className="icon vp-icon text-warning" />
                              <Star className="icon vp-icon text-warning opacity-25" />
                            </div>
                            <div className="review-count">102 Reviews</div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* SUPPORT REQUESTS */}
                <div className="col-md-6 col-xxl-4">
                  <div className="card h-100 premium-card">
                    <div className="card-inner border-bottom">
                      <div className="card-title-group">
                        <div className="card-title">
                          <h6 className="title">Support Requests</h6>
                        </div>
                        <div className="card-tools">
                          <a href="#" className="link">
                            All Requests
                          </a>
                        </div>
                      </div>
                    </div>

                    <ul className="nk-support">
                      <li className="nk-support-item">
                        <div className="user-avatar bg-purple-dim">
                          <span>KN</span>
                          <img src="images/a-sm.jpg" alt="" />
                        </div>
                        <div className="nk-support-content">
                          <div className="title">
                            <span>Kavya Nair</span>
                            <div className="status delivered">
                              <CheckCircle2 className="icon vp-icon text-success" />
                            </div>
                          </div>
                          <p>
                            Unable to access course materials for Full Stack batch — need
                            quick assistance.
                          </p>
                          <span className="time">6 min ago</span>
                        </div>
                      </li>

                      <li className="nk-support-item">
                        <div className="user-avatar bg-purple-dim">
                          <span>MG</span>
                        </div>
                        <div className="nk-support-content">
                          <div className="title">
                            <span>Manish Gupta</span>
                            <div className="status unread">
                              <Dot className="icon vp-icon text-danger" />
                            </div>
                          </div>
                          <p>
                            Requesting invoice copy for the Android course purchase last
                            week.
                          </p>
                          <span className="time">2 Hours ago</span>
                        </div>
                      </li>

                      <li className="nk-support-item">
                        <div className="user-avatar bg-purple-dim">
                          <span>MG</span>
                          <img src="images/b-sm.jpg" alt="" />
                        </div>
                        <div className="nk-support-content">
                          <div className="title">
                            <span>Rohit Sharma</span>
                            <div className="status sent">
                              <CheckCircle className="icon vp-icon text-primary" />
                            </div>
                          </div>
                          <p>
                            Feedback: The ML module would benefit from more hands-on
                            projects.
                          </p>
                          <span className="time">3 Hours ago</span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* ACTIVE STUDENTS */}
                <div className="col-md-6 col-xxl-8">
                  <div className="card h-100 premium-card">
                    <div className="card-inner">
                      <div className="card-title-group align-start pb-3 g-2">
                        <div className="card-title card-title-sm">
                          <h6 className="title">Active Students</h6>
                          <p>How your students have engaged over the selected period.</p>
                        </div>
                        <div className="card-tools">
                          <HelpCircle
                            className="card-hint icon vp-icon"
                            data-bs-toggle="tooltip"
                            data-bs-placement="left"
                            title="Users of this month"
                          />
                        </div>
                      </div>

                      <div className="analytic-au">
                        <div className="analytic-data-group analytic-au-group g-3">
                          <div className="analytic-data analytic-au-data">
                            <div className="title">Monthly</div>
                            <div className="amount">9.28K</div>
                            <div className="change up">
                              <ArrowUpRight className="icon vp-icon me-1" />
                              4.63%
                            </div>
                          </div>
                          <div className="analytic-data analytic-au-data">
                            <div className="title">Weekly</div>
                            <div className="amount">2.69K</div>
                            <div className="change down">
                              <ArrowDownRight className="icon vp-icon me-1" />
                              1.92%
                            </div>
                          </div>
                          <div className="analytic-data analytic-au-data">
                            <div className="title">Daily (Avg)</div>
                            <div className="amount">0.94K</div>
                            <div className="change up">
                              <ArrowUpRight className="icon vp-icon me-1" />
                              3.45%
                            </div>
                          </div>
                        </div>

                        <div className="analytic-au-ck">
                          <div
                            className="nk-sales-ck"
                            style={{ width: "100%", height: 180 }}
                          >
                            <ActiveStudentsChart />
                          </div>
                        </div>

                        <div className="chart-label-group">
                          <div className="chart-label">01 Nov, 2025</div>
                          <div className="chart-label">30 Nov, 2025</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TRAFFIC SOURCES */}
                <div className="col-xxl-4 col-md-6">
                  <div className="card card-full overflow-hidden premium-card">
                    <div className="nk-ecwg nk-ecwg4 h-100">
                      <div className="card-inner flex-grow-1">
                        <div className="card-title-group mb-4">
                          <div className="card-title">
                            <h6 className="title">Traffic Sources</h6>
                          </div>
                          <div className="card-tools">
                            <div className="dropdown">
                              <a
                                href="#"
                                className="dropdown-toggle link link-light link-sm"
                                data-bs-toggle="dropdown"
                              >
                                30 Days
                              </a>
                              <div className="dropdown-menu dropdown-menu-sm dropdown-menu-end">
                                <ul className="link-list-opt no-bdr">
                                  <li>
                                    <a href="#">
                                      <span>15 Days</span>
                                    </a>
                                  </li>
                                  <li>
                                    <a href="#" className="active">
                                      <span>30 Days</span>
                                    </a>
                                  </li>
                                  <li>
                                    <a href="#">
                                      <span>3 Months</span>
                                    </a>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex align-items-center">
                          <div style={{ width: "45%", height: 230 }}>
                            <TrafficSourcesChart />
                          </div>

                          {/* Dynamic Legend */}
                          <div className="ms-4 flex-grow-1">
                            {trafficData.map((item) => (
                              <div
                                key={item.name}
                                className="d-flex align-items-center justify-content-between mb-3"
                              >
                                <div className="d-flex align-items-center gap-2">
                                  <span
                                    style={{
                                      width: 14,
                                      height: 14,
                                      borderRadius: 4,
                                      backgroundColor: item.color,
                                      display: "inline-block",
                                    }}
                                  ></span>
                                  <span className="fw-medium">
                                    {item.name}
                                  </span>
                                </div>
                                <span className="fw-bold">
                                  {item.value.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="card-inner card-inner-md bg-light">
                        <div className="card-note d-flex align-items-center gap-2">
                          <Info className="icon vp-icon text-primary" />
                          <span>Insights over the past few days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            {/* ====================== END DASHBOARD ======================= */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
