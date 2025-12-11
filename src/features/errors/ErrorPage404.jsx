import React from "react";

const PageUnderConstruction = () => {
  const robotIllustrationUrl = "https://previews.123rf.com/images/jakarin2521/jakarin25211804/jakarin2521180400005/98543408-concept-of-under-construction-website-graphic-of-construction-site-with-industrial-crane.avif";

  return (
    <main className="nk-wrap bg-light min-vh-100 d-flex align-items-center">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-11 col-md-9 col-lg-7">
            <div className="card bg-white-1 border-0 rounded-4 has-shadow overflow-hidden">
              {/* TOP STRIP */}
              <div className="border-bottom px-4 py-3 d-flex justify-content-between align-items-center">
                <span className="badge bg-warning-dim text-warning text-uppercase fs-10px fw-semibold">
                  In progress
                </span>
                <span className="text-soft fs-12px">
                  We’re building something new here.
                </span>
              </div>

              {/* MAIN CONTENT */}
              <div className="card-body px-4 px-md-5 py-4 py-md-5">
                <div className="text-center mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning-dim text-warning mb-3 p-3">
                    <span className="fs-2">🚧</span>
                  </div>
                  <h1 className="h4 mb-2">Page under construction</h1>
                  <p className="text-soft mb-0">
                    This page is being designed and wired up.
                    <br />
                    Please check back soon.
                  </p>
                </div>

                {/* ROBOT ILLUSTRATION */}
                <div className="row g-3 justify-content-center mb-4">
                  <div className="col-10 col-sm-8">
                    <div className="ratio ratio-16x9 rounded-4 bg-light d-flex align-items-center justify-content-center">
                      <img
                        src={robotIllustrationUrl}
                        alt="Under construction"
                        className="img-fluid"
                      />
                    </div>
                  </div>
                </div>

                {/* TOOLBOX SPILLED UI PIECES */}
                <div className="px-3">
                  <div
                    className="position-relative mx-auto"
                    style={{ maxWidth: "320px", height: "120px" }}
                  >


                    {/* Spilled UI chips */}
                    <div
                      className="position-absolute"
                      style={{
                        top: "6px",
                        left: "0px",
                        transform: "rotate(-12deg)",
                      }}
                    >
                      <span className="badge bg-gray-200 text-muted fs-11px">
                        System Logic
                      </span>
                    </div>

                    <div
                      className="position-absolute"
                      style={{
                        top: "-4px",
                        right: "4px",
                        transform: "rotate(10deg)",
                      }}
                    >
                      <span className="badge bg-gray-200 text-muted fs-11px">
                        Card header
                      </span>
                    </div>

                    <div
                      className="position-absolute"
                      style={{
                        top: "40px",
                        left: "32px",
                        transform: "rotate(-5deg)",
                      }}
                    >
                      <span className="badge bg-gray-200 text-muted fs-11px">
                        Filter chip
                      </span>
                    </div>

                    <div
                      className="position-absolute"
                      style={{
                        top: "42px",
                        right: "34px",
                        transform: "rotate(14deg)",
                      }}
                    >
                      <span className="badge bg-gray-200 text-muted fs-11px">
                        Slider track
                      </span>
                    </div>

                    <div
                      className="position-absolute"
                      style={{
                        bottom: "38px",
                        left: "18px",
                        transform: "rotate(-16deg)",
                      }}
                    >
                      <span className="badge bg-gray-200 text-muted fs-11px">
                        Menu item
                      </span>
                    </div>

                    <div
                      className="position-absolute"
                      style={{
                        bottom: "36px",
                        right: "12px",
                        transform: "rotate(6deg)",
                      }}
                    >
                      <span className="badge bg-gray-200 text-muted fs-11px">
                        Sidebar tab
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER NOTE */}
              <div className="bg-gray-dim px-4 py-2 text-center">
                <span className="text-soft fs-12px">
                  You can continue using the rest of the app while our robot picks the UI pieces back up.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PageUnderConstruction;

