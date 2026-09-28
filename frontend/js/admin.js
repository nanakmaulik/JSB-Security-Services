const supabaseClient = supabase.createClient(
    "https://azzvzmuwopejemvfurzl.supabase.co",
    "sb_publishable_SE5eRbtDnaaPZOgtyYZHSg_ZyUaQPhS"
);


let currentSection = "quotes";
let currentRecords = [];
let editingRecord = null;


/* =========================================================
   AUTH CHECK
========================================================= */
async function checkAdmin() {

    try {

        // Get current Supabase session
        const {
            data: { session },
            error: sessionError
        } = await supabaseClient.auth.getSession();


        if (sessionError) {
            console.error("Session error:", sessionError);
            return false;
        }


        // No login session
        if (!session || !session.user) {

            window.location.replace("admin-login.html");

            return false;
        }


        const user = session.user;

        console.log("Logged in user:", user.email);
        console.log("Logged in UID:", user.id);


        // Check whether logged-in user is an admin
        const {
            data: admin,
            error: adminError
        } = await supabaseClient
            .from("admin_users")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();


        if (adminError) {

            console.error(
                "Admin verification error:",
                adminError
            );

            alert(
                "Unable to verify administrator access. Check Supabase permissions."
            );

            return false;
        }


        // Logged in but NOT registered as admin
        if (!admin) {

            console.error(
                "This user is authenticated but is not in admin_users:",
                user.id
            );

            await supabaseClient.auth.signOut();

            alert(
                "This account does not have administrator access."
            );

            window.location.replace("admin-login.html");

            return false;
        }


        console.log("Admin verified successfully.");

        return true;


    } catch (error) {

        console.error(
            "Admin authentication error:",
            error
        );

        return false;
    }
}


/* =========================================================
   LOAD QUOTES
========================================================= */

async function loadQuotes() {

    const { data, error } = await supabaseClient
        .from("quote_requests")
        .select("*")
        .order("created_at", {
            ascending: false
        });


    if (error) {
        console.error(error);
        return;
    }


    currentRecords = data || [];

    renderRecords();
}


/* =========================================================
   LOAD CAREERS
========================================================= */

async function loadCareers() {

    const { data, error } = await supabaseClient
        .from("job_applications")
        .select("*")
        .order("created_at", {
            ascending: false
        });


    if (error) {
        console.error(error);
        return;
    }


    currentRecords = data || [];

    renderRecords();
}


/* =========================================================
   SAFE HTML
========================================================= */

function escapeHTML(value = "") {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   DATE
========================================================= */

function formatDate(value) {

    if (!value) return "—";

    return new Date(value).toLocaleString();
}


/* =========================================================
   RENDER
========================================================= */

function renderRecords() {

    const container =
        document.getElementById("adminCards");

    const search =
        document
            .getElementById("adminSearch")
            .value
            .trim()
            .toLowerCase();

    const filter =
        document.getElementById("statusFilter").value;


    const filtered = currentRecords.filter(record => {

        const searchable =
            JSON.stringify(record).toLowerCase();

        const searchMatch =
            searchable.includes(search);

        const statusMatch =
            filter === "all" ||
            record.status === filter;

        return searchMatch && statusMatch;
    });


    updateStats();


    if (!filtered.length) {

        container.innerHTML = `
            <div class="empty-state">
                No records found.
            </div>
        `;

        return;
    }


    container.innerHTML = filtered
        .map(record => {

            if (currentSection === "quotes") {

                return quoteCard(record);

            }

            return careerCard(record);

        })
        .join("");
}


/* =========================================================
   QUOTE CARD
========================================================= */

function quoteCard(record) {

    return `
        <article class="lead-card">

            <div class="lead-card-top">

                <div>
                    <span class="lead-type">
                        SECURITY INQUIRY
                    </span>

                    <h2>
                        ${escapeHTML(record.full_name)}
                    </h2>

                    <p>
                        ${formatDate(record.created_at)}
                    </p>
                </div>

                <span class="status-badge status-${record.status}">
                    ${escapeHTML(record.status)}
                </span>

            </div>


            <div class="lead-information">

                <div>
                    <span>Email</span>
                    <strong>
                        ${escapeHTML(record.email)}
                    </strong>
                </div>

                <div>
                    <span>Phone</span>
                    <strong>
                        ${escapeHTML(record.phone)}
                    </strong>
                </div>

                <div>
                    <span>Location</span>
                    <strong>
                        ${escapeHTML(record.city_location)}
                    </strong>
                </div>

                <div>
                    <span>Service</span>
                    <strong>
                        ${escapeHTML(record.security_service)}
                    </strong>
                </div>

                <div>
                    <span>Property</span>
                    <strong>
                        ${escapeHTML(record.property_environment)}
                    </strong>
                </div>

                <div>
                    <span>Coverage</span>
                    <strong>
                        ${escapeHTML(record.coverage_requirement || "—")}
                    </strong>
                </div>

            </div>


            <div class="lead-message">

                <span>Requirements</span>

                <p>
                    ${escapeHTML(record.requirements)}
                </p>

            </div>


            <div class="lead-actions">

                <button
    onclick="acceptRecord('${record.id}')"
    class="accept-btn"
>
    ✓ Accept
</button>

<button
    onclick="rejectRecord('${record.id}')"
    class="reject-btn"
>
    ✕ Reject
</button>

                <button
                    onclick="openEdit('${record.id}')"
                    class="edit-btn"
                >
                    Edit
                </button>

            </div>

        </article>
    `;
}


/* =========================================================
   CAREER CARD
========================================================= */

function careerCard(record) {

    return `
        <article class="lead-card">

            <div class="lead-card-top">

                <div>
                    <span class="lead-type">
                        CAREER APPLICATION
                    </span>

                    <h2>
                        ${escapeHTML(record.full_name)}
                    </h2>

                    <p>
                        ${formatDate(record.created_at)}
                    </p>
                </div>

                <span class="status-badge status-${record.status}">
                    ${escapeHTML(record.status)}
                </span>

            </div>


            <div class="lead-information">

                <div>
                    <span>Email</span>
                    <strong>
                        ${escapeHTML(record.email)}
                    </strong>
                </div>

                <div>
                    <span>Phone</span>
                    <strong>
                        ${escapeHTML(record.phone)}
                    </strong>
                </div>

                <div>
                    <span>City</span>
                    <strong>
                        ${escapeHTML(record.city)}
                    </strong>
                </div>

                <div>
                    <span>Availability</span>
                    <strong>
                        ${escapeHTML(record.availability)}
                    </strong>
                </div>

                <div>
                    <span>Preferred Shift</span>
                    <strong>
                        ${escapeHTML(record.preferred_shift)}
                    </strong>
                </div>

                <div>
                    <span>Licence</span>
                    <strong>
                        ${escapeHTML(record.licence_number)}
                    </strong>
                </div>

            </div>


            <div class="lead-message">

                <span>Additional Information</span>

                <p>
                    ${escapeHTML(
                        record.additional_information || "—"
                    )}
                </p>

            </div>


            <div class="lead-actions">

               <button
    type="button"
    class="accept-btn"
    onclick="acceptCareer('${record.id}')"
>
    ✓ Accept
</button>

<button
    type="button"
    class="reject-btn"
    onclick="rejectCareer('${record.id}')"
>
    ✕ Reject
</button>

                <button
                    onclick="openEdit('${record.id}')"
                    class="edit-btn"
                >
                    Edit
                </button>

                <button
                    onclick="viewResume('${record.resume_path}')"
                    class="resume-btn"
                >
                    View Resume
                </button>

            </div>

        </article>
    `;
}
async function rejectRecord(id) {

    const record = currentRecords.find(
        item => item.id === id
    );

    if (!record) return;


    const confirmed = confirm(
        `Reject and permanently remove ${record.full_name}?`
    );

    if (!confirmed) return;


    const table =
        currentSection === "quotes"
            ? "quote_requests"
            : "job_applications";


    try {

        // Career application: remove private resume first
        if (
            currentSection === "careers" &&
            record.resume_path
        ) {

            const { error: resumeError } =
                await supabaseClient
                    .storage
                    .from("resumes")
                    .remove([
                        record.resume_path
                    ]);


            if (resumeError) {
                throw resumeError;
            }
        }


        // Permanently remove database record
        const { error: deleteError } =
            await supabaseClient
                .from(table)
                .delete()
                .eq("id", id);


        if (deleteError) {
            throw deleteError;
        }


        alert(
            `${record.full_name} has been rejected and removed.`
        );


        await reloadCurrentSection();


    } catch (error) {

        console.error(
            "Reject error:",
            error
        );

        alert(
            error.message ||
            "Unable to reject this record."
        );
    }
}


/* =========================================================
   STATUS UPDATE
========================================================= */
async function acceptRecord(id) {

    const record = currentRecords.find(
        item => item.id === id
    );

    if (!record) return;


    const confirmed = confirm(
        `Are you sure you want to accept ${record.full_name}?`
    );

    if (!confirmed) return;


    const table =
        currentSection === "quotes"
            ? "quote_requests"
            : "job_applications";


    try {

        const { error } =
            await supabaseClient
                .from(table)
                .update({
                    status: "accepted"
                })
                .eq("id", id);


        if (error) {
            throw error;
        }


        alert("Accepted successfully.");


        await reloadCurrentSection();


    } catch (error) {

        console.error(
            "Accept error:",
            error
        );


        alert(
            error.message ||
            "Unable to accept this record."
        );
    }
}


/* =========================================================
   VIEW PRIVATE RESUME
========================================================= */

async function viewResume(path) {

    if (!path) {
        alert("No resume available.");
        return;
    }


    const { data, error } =
        await supabaseClient
            .storage
            .from("resumes")
            .createSignedUrl(
                path,
                60
            );


    if (error) {

        alert(error.message);

        return;
    }


    window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
    );
}


/* =========================================================
   EDIT
========================================================= */

function openEdit(id) {

    editingRecord =
        currentRecords.find(
            record => record.id === id
        );


    if (!editingRecord) return;


    const fields =
        document.getElementById("editFields");


    if (currentSection === "quotes") {

        fields.innerHTML = `

            ${inputField(
                "Full Name",
                "full_name",
                editingRecord.full_name
            )}

            ${inputField(
                "Phone",
                "phone",
                editingRecord.phone
            )}

            ${inputField(
                "Email",
                "email",
                editingRecord.email
            )}

            ${inputField(
                "City / Location",
                "city_location",
                editingRecord.city_location
            )}

            ${textareaField(
                "Requirements",
                "requirements",
                editingRecord.requirements
            )}
        `;

    } else {

        fields.innerHTML = `

            ${inputField(
                "Full Name",
                "full_name",
                editingRecord.full_name
            )}

            ${inputField(
                "Phone",
                "phone",
                editingRecord.phone
            )}

            ${inputField(
                "Email",
                "email",
                editingRecord.email
            )}

            ${inputField(
                "City",
                "city",
                editingRecord.city
            )}

            ${textareaField(
                "Additional Information",
                "additional_information",
                editingRecord.additional_information || ""
            )}
        `;
    }


    document
        .getElementById("editModal")
        .classList.add("open");
}


function inputField(label, name, value) {

    return `
        <label class="admin-field">
            <span>${label}</span>

            <input
                name="${name}"
                value="${escapeHTML(value || "")}"
                required
            >
        </label>
    `;
}


function textareaField(label, name, value) {

    return `
        <label class="admin-field">
            <span>${label}</span>

            <textarea
                name="${name}"
                rows="5"
            >${escapeHTML(value || "")}</textarea>

        </label>
    `;
}


/* =========================================================
   SAVE EDIT
========================================================= */

document
    .getElementById("editForm")
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!editingRecord) return;


            const formData =
                new FormData(event.target);

            const updates =
                Object.fromEntries(
                    formData.entries()
                );


            const table =
                currentSection === "quotes"
                    ? "quote_requests"
                    : "job_applications";


            const { error } =
                await supabaseClient
                    .from(table)
                    .update(updates)
                    .eq(
                        "id",
                        editingRecord.id
                    );


            if (error) {

                alert(error.message);

                return;
            }


            closeModal();

            await reloadCurrentSection();
        }
    );


/* =========================================================
   MODAL
========================================================= */

function closeModal() {

    document
        .getElementById("editModal")
        .classList.remove("open");

    editingRecord = null;
}


document
    .getElementById("modalClose")
    .addEventListener(
        "click",
        closeModal
    );


/* =========================================================
   STATS
========================================================= */

function updateStats() {

    document.getElementById("totalStat").textContent =
        currentRecords.length;


    document.getElementById("newStat").textContent =
        currentRecords.filter(
            record => record.status === "new"
        ).length;


    document.getElementById("acceptedStat").textContent =
        currentRecords.filter(
            record => record.status === "accepted"
        ).length;


    document.getElementById("rejectedStat").textContent =
        currentRecords.filter(
            record => record.status === "rejected"
        ).length;


    if (currentSection === "quotes") {

        document.getElementById("quoteCount").textContent =
            currentRecords.filter(
                record => record.status === "new"
            ).length;

    } else {

        document.getElementById("careerCount").textContent =
            currentRecords.filter(
                record => record.status === "new"
            ).length;
    }
}


/* =========================================================
   RELOAD
========================================================= */

async function reloadCurrentSection() {

    if (currentSection === "quotes") {

        await loadQuotes();

    } else {

        await loadCareers();
    }
}


/* =========================================================
   SIDEBAR
========================================================= */

document
    .querySelectorAll(".admin-nav-item")
    .forEach(button => {

        button.addEventListener(
            "click",
            async () => {

                document
                    .querySelectorAll(".admin-nav-item")
                    .forEach(item =>
                        item.classList.remove("active")
                    );


                button.classList.add("active");


                currentSection =
                    button.dataset.section;


                document.getElementById(
                    "dashboardTitle"
                ).textContent =
                    currentSection === "quotes"
                        ? "Quote Requests"
                        : "Career Applications";


                document.getElementById(
                    "adminSearch"
                ).value = "";


                document.getElementById(
                    "statusFilter"
                ).value = "all";


                await reloadCurrentSection();
            }
        );
    });


/* =========================================================
   SEARCH / FILTER
========================================================= */

document
    .getElementById("adminSearch")
    .addEventListener(
        "input",
        renderRecords
    );


document
    .getElementById("statusFilter")
    .addEventListener(
        "change",
        renderRecords
    );


/* =========================================================
   LOGOUT
========================================================= */

document
    .getElementById("logoutButton")
    .addEventListener(
        "click",
        async () => {

            await supabaseClient.auth.signOut();

            window.location.href =
                "admin-login.html";
        }
    );


/* =========================================================
   START
========================================================= */

(async function startDashboard() {

    const allowed =
        await checkAdmin();

    if (!allowed) return;

    await loadQuotes();

})();/* =========================================================
   CAREER APPLICATION - ACCEPT
========================================================= */

async function acceptCareer(id) {

    const confirmed = confirm(
        "Are you sure you want to accept this career application?"
    );

    if (!confirmed) return;

    try {

        const { error } = await supabaseClient
            .from("job_applications")
            .update({
                status: "accepted"
            })
            .eq("id", id);

        if (error) {
            throw error;
        }

        alert("Career application accepted successfully.");

        // Reload career applications
        await loadCareers();

    } catch (error) {

        console.error(
            "Career accept error:",
            error
        );

        alert(
            error.message ||
            "Unable to accept this career application."
        );
    }
}


/* =========================================================
   CAREER APPLICATION - REJECT + DELETE
========================================================= */

async function rejectCareer(id) {

    const record = currentRecords.find(
        item => item.id === id
    );

    if (!record) {
        alert("Application could not be found.");
        return;
    }

    const confirmed = confirm(
        `Reject and permanently remove ${record.full_name}'s application?`
    );

    if (!confirmed) return;

    try {

        /* -----------------------------------------
           1. Delete uploaded resume
        ----------------------------------------- */

        if (record.resume_path) {

            const { error: resumeError } =
                await supabaseClient
                    .storage
                    .from("resumes")
                    .remove([
                        record.resume_path
                    ]);

            if (resumeError) {
                throw resumeError;
            }
        }


        /* -----------------------------------------
           2. Delete application from database
        ----------------------------------------- */

        const { error: deleteError } =
            await supabaseClient
                .from("job_applications")
                .delete()
                .eq("id", id);

        if (deleteError) {
            throw deleteError;
        }


        alert(
            "Career application rejected and removed successfully."
        );


        // Reload career applications
        await loadCareers();


    } catch (error) {

        console.error(
            "Career reject error:",
            error
        );

        alert(
            error.message ||
            "Unable to reject this career application."
        );
    }
}