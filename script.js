const APP_ID = "93ae6391";
const APP_KEY = "089e0a2411a4129671465b07fca30420";
const DEFAULT_USER = "0";
//app id and app key are api keys from Edamam api so that i can use the api for searching recipes, while the default user was required as a header so i can use the api


const searchInput = document.querySelector("#search-input");
const searchBtn = document.querySelector("#search-btn");
const mealType = document.querySelector("#meal-type");
const recipesContainer = document.querySelector("#recipes-container");
const loadingIndicator = document.querySelector("#loading-indicator");
// any line of these DOM elements are connected to HTML elements as it makes it easier to access them

const MEAL_TYPES = {
    "": "Any Meal",
    "breakfast": "Breakfast",
    "lunch": "Lunch",
    "dinner": "Dinner",
    "snack": "Snack",
    "teatime": "Teatime"
};
// an object that contains meal types and their values

// Initialize meal type dropdown
function initMealTypeDropdown() {
    Object.entries(MEAL_TYPES).forEach(([value, text]) => {//loop through meals
        const option = document.createElement("option");//create the options 
        option.value = value;
        option.textContent = text;
        mealType.appendChild(option);//append the options to meal-type
    });
}

// Fetch recipes from Edamam API with modern fetch and error handling
async function fetchRecipes(query, mealType = "") {
    try {
        // these parameters makes searching for a recipe easier
        const params = new URLSearchParams({
            type: "public",
            q: query,
            app_id: APP_ID,
            app_key: APP_KEY,
            ...(mealType && { mealType }) // this parameter is optional(only added if mealType is not empty)
        });

        const url = `https://api.edamam.com/api/recipes/v2?${params.toString()}`;// this url that requests the api for a recipe
        
        loadingIndicator.style.display = "block"; // show loading indicator
        recipesContainer.innerHTML = ""; // clear previous results

        const response = await fetch(url, { // adds the header to the request, i had to use it cuase the api kept giving error without it
            headers: {
                "Edamam-Account-User": DEFAULT_USER
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`); // if response is not ok, throw an error
        }

        const data = await response.json(); // convert the api response into json(javascript object)
        return data.hits?.map(hit => hit.recipe) || []; // [data.hits?] prevent error if hits is undefined, while the map function loops through the hits and returns the recipe object
    } catch (error) { // incase of any error the catch block displays the error message
        console.error("Failed to fetch recipes:", error);
        showErrorMessage(error.message);
        return [];
    } finally { //no matter what the finally block runs
        loadingIndicator.style.display = "none"; //hide the loading indicator
    }
}

//if there is an error, this function is responsible for displaying it
function showErrorMessage(message) {
    recipesContainer.innerHTML = `
        <div class="error-message">
            <p>⚠️ Error: ${message}</p>
            <p>Please try again later.</p>
        </div>
    `;
}

// display recipes using array methods and DOM manipulation
function displayRecipes(recipes) {
    recipesContainer.innerHTML = ""; // clear the previous results
    
    if (!recipes?.length) { // check if recipes is empty or undefined
        recipesContainer.innerHTML = "<p class='no-results'>🍽️ No recipes found. Try another search!</p>";
        return;
    }

    // here i used map and join to create the recipe cards
    const recipesHTML = recipes.map(recipe => createRecipeCard(recipe)).join("");// the recipe.map go through each recipe and create a recipe card using the createRecipeCard function, while the join combines the recipe cards into a single string
    recipesContainer.insertAdjacentHTML("beforeend", recipesHTML);// insert the recipe cards into the recipes container
}

// just a function to create a recipe cards
function createRecipeCard(recipe) {
    const { label, image, url, calories, mealType, cuisineType, dietLabels } = recipe; // destructuring the recipe object to get the values of the properties
    
    const formattedCalories = Math.floor(calories).toLocaleString(); // basically formating the calories to a string
    
    // Using array join for tags
    const tags = [...(cuisineType || []), ...(dietLabels || [])] // this line of code combines the cuisineType and dietLabels arrays into a single array
        .map(tag => `<span class="tag">${tag}</span>`)
        .join("");

    // this is the template literal that creates the recipe card
    return ` 
        <div class="recipe-card">
            <img src="${image}" alt="${label}" class="recipe-img" loading="lazy">
            <div class="recipe-info">
                <h3 class="recipe-title">${label}</h3>
                <div class="recipe-tags">${tags}</div>
                <div class="recipe-details">
                    <p><strong>Calories:</strong> ${formattedCalories}</p>
                    ${mealType ? `<p><strong>Meal:</strong> ${mealType.join(", ")}</p>` : ""}
                </div>
                <a href="${url}" target="_blank" class="view-recipe">View Recipe →</a>
            </div>
        </div>
    `;
}

//prevent rapid API calls. just a performance optimization
function debounce(func, delay = 500) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// event listener
searchBtn.addEventListener("click", async () => { //1- when the search button is clicked
    const query = searchInput.value.trim();
    if (!query) { // check if the search input is empty
        showErrorMessage("Please enter a search term");
        return;
    }

    const recipes = await fetchRecipes(query, mealType.value); //2- it fetches the recipes using the fetchRecipes function
    displayRecipes(recipes); //3- and display them
});

searchInput.addEventListener("keyup", debounce(async (e) => { //here it uses the debounce to prevent rapid API calls
    if (e.key === "Enter" || e.target.value.trim().length >= 3) { //to check if the enter key is pressed is >= 3 characters
        const query = searchInput.value.trim();// get the search input value
        if (query) {
            const recipes = await fetchRecipes(query, mealType.value);// fetches the recipes
            displayRecipes(recipes);// and display them
        }
    }
}));

// just a line to initialize the meal type dropdown
initMealTypeDropdown();