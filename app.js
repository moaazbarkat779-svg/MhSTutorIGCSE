
/*
    Mh.S Mathematics
    Student registration and login
    Supabase JavaScript client v2

    IMPORTANT:
    1. Replace SUPABASE_URL with your project's Project URL.
    2. Replace SUPABASE_PUBLIC_KEY with your publishable key
       or legacy anon key.
    3. Never put a service_role or secret key in this file.
*/

const SUPABASE_URL = "https://usnxjwapsfyuqnvuysjs.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_22p3G6H5F7wNmobahYtONA_7pzdHXHG";

// Create the Supabase client.
let supabase = null;

if (
    window.supabase &&
    SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("YOUR_SUPABASE")
    && SUPABASE_PUBLIC_KEY
    && !SUPABASE_PUBLIC_KEY.includes("YOUR_SUPABASE")
) {
    try {
        supabase = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLIC_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );
    } catch (error) {
        console.error("Supabase initialization failed:", error);
    }
}

// DOM elements.
const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");

const signupButton = document.getElementById("signup-button");
const loginButton = document.getElementById("login-button");

const showLoginButton = document.getElementById("show-login");
const showSignupButton = document.getElementById("show-signup");
const forgotPasswordButton = document.getElementById("forgot-password");

const stageSelect = document.getElementById("stage");
const qualificationField = document.getElementById("qualification-field");
const qualificationSelect = document.getElementById("qualification");
const mathsTypeSelect = document.getElementById("maths-type");

const notice = document.getElementById("notice");
const noticeText = document.getElementById("notice-text");
const noticeAction = document.getElementById("notice-action");

const formHeading = document.getElementById("form-heading");
const formDescription = document.getElementById("form-description");
const authKicker = document.getElementById("auth-kicker");

document.getElementById("current-year").textContent =
    new Date().getFullYear();

// Show a custom in-page notice.
function showNotice(message, type = "info", action = null) {
    notice.hidden = false;
    notice.dataset.type = type;
    noticeText.textContent = message;

    if (action === "login") {
        noticeAction.hidden = false;
        noticeAction.textContent = "Go to login";
        noticeAction.onclick = () => switchToLogin(true);
    } else if (action === "signup") {
        noticeAction.hidden = false;
        noticeAction.textContent = "Create an account";
        noticeAction.onclick = () => switchToSignup(true);
    } else {
        noticeAction.hidden = true;
        noticeAction.onclick = null;
    }
}

function hideNotice() {
    notice.hidden = true;
    noticeText.textContent = "";
    noticeAction.hidden = true;
    noticeAction.onclick = null;
    delete notice.dataset.type;
}

// Reset messages when a student changes a form.
function clearNoticeOnInput(form) {
    form.addEventListener("input", hideNotice);
    form.addEventListener("change", hideNotice);
}

clearNoticeOnInput(signupForm);
clearNoticeOnInput(loginForm);

// Switch between registration and login.
function switchToLogin(preserveEmail = false) {
    const signupEmail = document.getElementById("signup-email").value.trim();
    const loginEmail = document.getElementById("login-email");

    signupForm.hidden = true;
    loginForm.hidden = false;

    formHeading.textContent = "Welcome back";
    formDescription.textContent =
        "Log in to access your Mh.S Mathematics account.";
    authKicker.textContent = "STUDENT LOGIN";

    if (preserveEmail && signupEmail) {
        loginEmail.value = signupEmail;
    }

    hideNotice();
    window.scrollTo({ top: 0, behavior: "smooth" });
    loginEmail.focus({ preventScroll: true });
}

function switchToSignup(preserveEmail = false) {
    const loginEmail = document.getElementById("login-email").value.trim();

    signupForm.hidden = false;
    loginForm.hidden = true;

    formHeading.textContent = "Join Mh.S Mathematics";
    formDescription.textContent =
        "Enter your details to create your student account.";
    authKicker.textContent = "CREATE YOUR ACCOUNT";

    if (preserveEmail && loginEmail) {
        document.getElementById("signup-email").value = loginEmail;
    }

    hideNotice();
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.getElementById("signup-email").focus({
        preventScroll: true
    });
}

showLoginButton.addEventListener("click", () => switchToLogin());
showSignupButton.addEventListener("click", () => switchToSignup());

// Keep course options synchronized with the selected stage.
function updateMathsOptions() {
    const stage = stageSelect.value;

    mathsTypeSelect.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.selected = true;

    if (stage === "IGCSE") {
        placeholder.textContent = "Select mathematics type";
        mathsTypeSelect.add(placeholder);

        mathsTypeSelect.add(new Option("Mathematics", "Mathematics"));
        mathsTypeSelect.add(
            new Option("Additional Mathematics", "Additional Mathematics")
        );

        mathsTypeSelect.disabled = false;

        qualificationField.hidden = true;
        qualificationSelect.disabled = true;
        qualificationSelect.required = false;
        qualificationSelect.value = "";
    } else if (stage === "A Level") {
        placeholder.textContent = "Select mathematics type";
        mathsTypeSelect.add(placeholder);

        mathsTypeSelect.add(new Option("Mathematics", "Mathematics"));
        mathsTypeSelect.add(
            new Option("Further Mathematics", "Further Mathematics")
        );

        mathsTypeSelect.disabled = false;

        qualificationField.hidden = false;
        qualificationSelect.disabled = false;
        qualificationSelect.required = true;
    } else {
        placeholder.textContent = "Select stage first";
        mathsTypeSelect.add(placeholder);
        mathsTypeSelect.disabled = true;

        qualificationField.hidden = true;
        qualificationSelect.disabled = true;
        qualificationSelect.required = false;
        qualificationSelect.value = "";
    }

    mathsTypeSelect.value = "";
}

stageSelect.addEventListener("change", updateMathsOptions);
updateMathsOptions();

// Check that the client has been configured before any request.
function ensureSupabase() {
    if (!supabase) {
        showNotice(
            "Supabase is not configured yet. Open app.js and replace the project URL and public key with the values from your Supabase project.",
            "error"
        );
        return false;
    }

    return true;
}

// Prevent double submissions and give visible feedback.
function setLoading(button, loading, label) {
    button.disabled = loading;
    button.querySelector(".button-label").textContent =
        loading ? label : button.dataset.originalLabel;
    button.setAttribute("aria-busy", String(loading));
}

signupButton.dataset.originalLabel = "Create Account";
loginButton.dataset.originalLabel = "Log In";

// Detect common duplicate-email responses without a separate public
// query against the user table.
//
// Supabase may return a user with an empty identities array when email
// confirmation is enabled and the email already belongs to an account.
function isExistingAccount(data, error) {
    if (error) {
        const message = String(error.message || "").toLowerCase();

        if (
            message.includes("already registered") ||
            message.includes("already been registered") ||
            message.includes("already exists") ||
            message.includes("user already exists")
        ) {
            return true;
        }
    }

    return Boolean(
        data &&
        data.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
    );
}

function friendlyAuthError(error, context) {
    const message = String(error?.message || "").toLowerCase();

    if (message.includes("invalid login credentials")) {
        return "The email or password is incorrect. Check your details or reset your password.";
    }

    if (message.includes("email not confirmed")) {
        return "Your email has not been confirmed yet. Check your inbox for the confirmation link.";
    }

    if (
        message.includes("password") &&
        (message.includes("weak") || message.includes("short"))
    ) {
        return "Please choose a stronger password that meets the password requirements.";
    }

    if (message.includes("rate limit") || message.includes("too many requests")) {
        return "Too many attempts have been made. Please wait a little while and try again.";
    }

    if (message.includes("network") || message.includes("fetch")) {
        return "We could not connect to the authentication service. Check your internet connection and try again.";
    }

    if (context === "signup") {
        return "Your account could not be created. Please check your details and try again.";
    }

    if (context === "reset") {
        return "The password reset email could not be sent. Please try again later.";
    }

    return "We could not complete your request. Please check your details and try again.";
}

// Direct student registration.
signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!signupForm.reportValidity()) {
        return;
    }

    if (!ensureSupabase()) {
        return;
    }

    const fullName = document.getElementById("full-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const stage = stageSelect.value;
    const qualification = qualificationSelect.value;
    const mathsType = mathsTypeSelect.value;
    const board = document.getElementById("board").value;
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (!fullName) {
        showNotice("Please enter your full name.", "error");
        return;
    }

    if (!stage || !mathsType || !board) {
        showNotice("Please complete all required course details.", "error");
        return;
    }

    if (stage === "A Level" && !qualification) {
        showNotice("Please select your A Level qualification type.", "error");
        return;
    }

    if (password.length < 8) {
        showNotice("Your password must contain at least 8 characters.", "error");
        return;
    }

    if (password !== confirmPassword) {
        showNotice("Your passwords do not match. Please try again.", "error");
        document.getElementById("confirm-password").focus();
        return;
    }

    setLoading(signupButton, true, "Creating account...");

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    phone: phone || null,
                    stage,
                    qualification_type:
                        stage === "A Level" ? qualification : null,
                    maths_type: mathsType,
                    board
                },
                emailRedirectTo: window.location.href.split("#")[0]
            }
        });

        if (isExistingAccount(data, error)) {
            showNotice(
                "An account may already exist for this email. Please log in instead. If you have not registered before, try again or contact support.",
                "info",
                "login"
            );
            switchToLogin(true);
            showNotice(
                "This email is already associated with an account. Please log in instead.",
                "info"
            );
            noticeAction.hidden = false;
            noticeAction.textContent = "Log in";
            noticeAction.onclick = () => switchToLogin(true);
            return;
        }

        if (error) {
            showNotice(friendlyAuthError(error, "signup"), "error");
            console.error("Supabase sign-up error:", error.message);
            return;
        }

        if (data.session) {
            showNotice(
                "Your account has been created and you are logged in. The dashboard has not been connected yet.",
                "success"
            );
        } else {
            showNotice(
                "Your registration request was accepted. Check your email for a confirmation link before logging in. If it does not arrive, check your spam folder.",
                "success"
            );

            // Let the student use the same email on the login screen.
            const savedEmail = email;
            signupForm.reset();
            updateMathsOptions();
            document.getElementById("login-email").value = savedEmail;
        }
    } catch (error) {
        console.error("Unexpected sign-up error:", error);
        showNotice(friendlyAuthError(error, "signup"), "error");
    } finally {
        setLoading(signupButton, false, "Create Account");
    }
});

// Log in an existing student.
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!loginForm.reportValidity()) {
        return;
    }

    if (!ensureSupabase()) {
        return;
    }

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    setLoading(loginButton, true, "Logging in...");

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            showNotice(friendlyAuthError(error, "login"), "error");
            console.error("Supabase login error:", error.message);
            return;
        }

        if (data.session) {
            showNotice(
                "Login successful. Your session is active. The student dashboard has not been connected yet.",
                "success"
            );
            loginForm.reset();
        }
    } catch (error) {
        console.error("Unexpected login error:", error);
        showNotice(friendlyAuthError(error, "login"), "error");
    } finally {
        setLoading(loginButton, false, "Log In");
    }
});

// Send a password recovery email.
forgotPasswordButton.addEventListener("click", async () => {
    if (!ensureSupabase()) {
        return;
    }

    const email = document.getElementById("login-email").value.trim();

    if (!email) {
        showNotice(
            "Enter your email address above first, then select Forgot your password.",
            "info"
        );
        document.getElementById("login-email").focus();
        return;
    }

    if (!document.getElementById("login-email").checkValidity()) {
        showNotice("Please enter a valid email address.", "error");
        return;
    }

    forgotPasswordButton.disabled = true;
    forgotPasswordButton.textContent = "Sending reset email...";

    try {
        const redirectUrl = window.location.href.split("#")[0];

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl
        });

        if (error) {
            showNotice(friendlyAuthError(error, "reset"), "error");
            console.error("Password reset error:", error.message);
            return;
        }

        showNotice(
            "If an account is registered with that email, a password reset link will be sent. Check your inbox and spam folder.",
            "success"
        );
    } catch (error) {
        console.error("Unexpected password reset error:", error);
        showNotice(friendlyAuthError(error, "reset"), "error");
    } finally {
        forgotPasswordButton.disabled = false;
        forgotPasswordButton.textContent = "Forgot your password?";
    }
});

// Handle an authentication link returning to this page.
async function checkReturnedAuthState() {
    if (!supabase) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    if (params.get("error") || params.get("error_description")) {
        const description =
            params.get("error_description") || "The authentication link is invalid or has expired.";

        showNotice(
            "Authentication link issue: " +
            description.replace(/\+/g, " "),
            "error"
        );
        return;
    }

    if (hash.includes("type=recovery")) {
        showNotice(
            "Password recovery link detected. Password updating will be connected when the account recovery interface is added.",
            "info"
        );
        return;
    }

    try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error("Could not retrieve session:", error.message);
            return;
        }

        if (data.session) {
            showNotice(
                "You are logged in. The student dashboard has not been connected yet.",
                "success"
            );
        }
    } catch (error) {
        console.error("Could not check authentication state:", error);
    }
}

checkReturnedAuthState();
