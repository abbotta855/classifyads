# Homepage Requirements

## Complete Client Requirements for ClassifiedAds Platform Homepage

### 1. Header/Navigation (Top Bar)

#### Top Section:
- **Logo Area**: Left side of the header
- **Navigation Links** (horizontal): 
  - "Category(All)"
  - "Location(All)"
  - "Log in area"
  - "Sign up area"
  - "Post Ad area"
- **Top Right**: 
  - "Login" link
  - "Sign up" link
  - "Post Ad" link
  - Shopping cart icon

#### Search Section (Below Navigation):
- **Search Bar**: Input field labeled "Search using KW" (Keyword)
- **Filter Dropdowns**: 
  - "Categories (All)" dropdown
  - "Location (All)" dropdown
- **Search Button**: To the right of the dropdowns

---

### 2. Left Sidebar — Filters

- **"All Categories" Heading**: Prominent heading at the top of the sidebar

#### "Find by" Section:
- **Category Filter**: 
  - Heading: "Category(all displayed for filter)"
  - All categories displayed with **checkboxes** for selection
- **Location Filter**: 
  - Heading: "Location area"
  - Same checkbox logic as category filter
- **Price Filter**: 
  - Heading: "Price area"
  - Min & max price input fields
- **"More options"** button/link

#### Dynamic Specification Filter:
- **Heading**: "Here is different Specification filter area to display based on relavency"
- **Logic**: Filter options change dynamically based on selected category/subcategory
- **Example**: "Men Pant(category, subcategory) Size Color Price range Brand ..."
- Note: "(user can choose option and based on this filter the relevant ad display on right side)"

#### Popular Ads Section (Bottom of Sidebar):
List of popular categories for quick navigation:
- Bus for sale
- Car for sale
- Construction Materials
- House for sale
- Jobs
- Land for sale
- Motorbike for sale
- Truck for sale

---

### 3. Main Content Area (Center)

#### Top Header:
- **"Search and filter result"** label
- **"Sorting option"** button on the right side

#### Main Ad Display Section:
- **Display Logic**: Show 39 ads on the homepage
- **Ad Card Specifications**:
  - Image: 1200x1200 pixels
  - Title: Maximum 80 characters
  - Description: Maximum 200 characters
  - Price field
  - "More" link to full ad details
- **"More" Button**: After 39 ads, display "more" button
  - When clicked → redirects to "all categories page" where user can choose relevant category/subcategory

#### Specific Category Sections (Below Main Ads):
Each category section displays:
- **4 ads in one row**
- **"more ad" button** after the 4th ad
- **Redirect Logic** when "more ad" is clicked:
  - "Land for sale" → redirects to "Land for sale" page
  - "Car for sale" → redirects to "Vehicle for sale" page
  - "Motorbike for sale" → redirects to "Motor bike for sale" page
  - "Construction Materials for sale" → redirects to "Construction Materials for sale" page
  - "Jobs" (4 ads) → redirects to "Jobs" page

---

### 4. Right Sidebar — Sorting Options

**"Sorting option:"** section with the following options:
- Most relevant
- Lowest price
- Highest price
- Ascending order
- Descending order
- Latest listing
- Top review

---

### 5. Bottom Section

#### "Our Happy Customer Says About Us" Section:
- **Heading**: "Our Happy Customer Says About Us" (single heading)
- **Text**: "Freshy Helpline always try to provide Best services to its Users. Here are some of the Satisfied Customers of Freshy Helpline."
- **Button**: "Know more about Us"

---

### 6. Footer

#### Left Side:
- "Copyright reserve info..."

#### Middle Left:
- About us
- Blog
- Contact us
- FAQ
- Online community

#### Middle Right:
- Cookies Policy
- Privacy Policy
- Terms of Services

#### Bottom Middle:
- "Subscribe: (email insert form)" - Email subscription input field

#### Bottom Right:
- "Social Media link" - Social media icons/links

---

## Design Notes

- **Layout**: Three-column layout (Filters left, Main content center, Sorting right)
- **Responsive**: Must be mobile-responsive
- **Filter Logic**: Category and Location use checkbox selection
- **Dynamic Filters**: Specification filters change based on selected category/subcategory
- **Pagination**: Main area shows 39 ads, then "more" button redirects to all categories page
- **Category Sections**: Each specific category shows 4 ads per row with "more ad" button redirecting to that category's page

---

## Technical Specifications

- **Ad Image Size**: 1200x1200 pixels
- **Title Limit**: 80 characters
- **Description Limit**: 200 characters
- **Main Ads Display**: 39 ads per page
- **Category Section Ads**: 4 ads per row per category

