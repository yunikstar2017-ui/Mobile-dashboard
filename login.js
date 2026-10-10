
/*
  Quick Notes Login
  Connects the login form to Supabase Authentication.
*/

// 1. Add your Supabase project credentials.
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

// 2. Create the Supabase client.
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

// 3. Find the elements in our HTML page.
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const message = document.getElementById("message");

// 4. Where to go after a successful login.
const NOTES_PAGE = "quick-notes/index.html";

// Display a message to the user.
function showMessage(text) {
    message.textContent = text;
}

// 5. If the user already has a valid session, open Quick Notes.
async function checkExistingSession() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        showMessage("Unable to check your session. Please try again.");
        return;
    }

    if (data.session) {
        window.location.replace(NOTES_PAGE);
    }
}

checkExistingSession();

// 6. Handle the login form when the user clicks Sign In.
loginForm.addEventListener("submit", async function (event) {
    // Stop the browser from refreshing the page.
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";
    showMessage("");

    try {
        // Ask Supabase to verify the email and password.
        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            showMessage(
                "Sign-in failed. Check your email and password, then try again."
            );
            return;
        }

        if (data.session) {
            showMessage("Login successful! Opening your notes...");

            window.location.replace(NOTES_PAGE);
        } else {
            showMessage("No active session was created. Please try again.");
        }
    } catch (error) {
        showMessage(
            "Could not connect. Check your internet connection and try again."
        );
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Sign In";
    }
});
