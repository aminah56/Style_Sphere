# Deployment Guide for StyleSphere on Vercel

You successfully deployed your code, but the database isn't working because your application checks for a **local** database (`localhost`), which doesn't exist on Vercel's servers.

To fix this, you must host your database in the cloud. Since your project is built with **Microsoft SQL Server (`mssql`)**, the best solution is to use **Azure SQL Database**.

## Step 1: Create a Cloud Database (Azure SQL)

1.  **Sign up for Azure**: Go to [portal.azure.com](https://portal.azure.com) and sign up (there is a free tier for students and new users).
2.  **Create a SQL Database**:
    *   Search for "SQL Database" and click "Create".
    *   **Resource Group**: Create a new one (e.g., `StyleSphereGroup`).
    *   **Region**: Choose a region close to your users. 
        *   If you are in **Pakistan/India**: Choose **Central India**, **West India**, or **UAE North**.
        *   If you are in **US/Europe** or just want the cheapest option: Choose **East US**.
    *   **Database Name**: `StyleSphere`.
    *   **Server**: Click "Create new". Use a unique server name.
        *   **Authentication**: Select "Use SQL authentication".
        *   **Admin login**: `aminah` (or your preferred user from your `.env`).
        *   **Password**: Choose a strong password.
    *   **Pricing Tier**: Look for a "Free" offer or select "Basic" (cheapest).
    *   **Networking**: **Crucial Step**:
        *   Set "Connectivity method" to "Public endpoint".
        *   Check **YES** for "Allow Azure services and resources to access this server".
3.  **Get Connection Details**:
    *   Once created, go to the database overview.
    *   Click "Connection strings" > "Node.js".
    *   Copy the Server name (e.g., `stylesphere-server.database.windows.net`) and User/Password.

## Step 2: Set up the Database Schema

1.  In the Azure Portal, go to your SQL Database.
2.  Click **Query editor (preview)** in the left menu.
3.  Login with the admin credentials you created.
4.  Open the `stylesphere.sql` file from your project on your computer.
5.  Copy the entire content and paste it into the Query Editor.
6.  Click **Run**.
    *   *Note: If you see errors about "USE StyleSphere", remove that line just for the Query Editor, as you are already connected to the database.*

## Step 3: Configure Vercel Environment Variables

1.  Go to your project settings on **Vercel**.
2.  Navigate to **Environment Variables**.
3.  Add the following variables (using the values from Step 1):

    | Key | Value (Example) |
    | :--- | :--- |
    | `DB_SERVER` | `your-server-name.database.windows.net` |
    | `DB_USER` | `aminah` |
    | `DB_PASSWORD` | `(The password you set in Azure)` |
    | `DB_NAME` | `StyleSphere` |
    | `DB_PORT` | `1433` |
    | `STRIPE_SECRET_KEY` | `(Your Stripe Secret Key)` |

4.  **Redeploy** your project (go to Deployments -> Redeploy) for these changes to take effect.

## Step 4: Frontend Configuration

Ensure your Frontend knows where the Backend is.
1.  In Vercel Environment Variables, add:
    *   `VITE_API_BASE_URL`: `/api`
    *   (Or the full URL: `https://your-project-name.vercel.app/api`)
2.  Add `VITE_STRIPE_PUBLIC_KEY` as well.

## Summary

Your app connects to `process.env.DB_SERVER`. On your computer, this is `localhost`. On Vercel, this must be the address of your Azure SQL Database. Once you add these Environment Variables in Vercel, the connection will work!
