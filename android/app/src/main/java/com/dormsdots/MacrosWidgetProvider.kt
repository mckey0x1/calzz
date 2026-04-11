package com.dormsdots

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import org.json.JSONObject

class MacrosWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        val sharedPref = context.getSharedPreferences("WidgetData", Context.MODE_PRIVATE)
        val dataStr = sharedPref.getString("widget_data", "{}")
        
        try {
            val data = JSONObject(dataStr)
            val caloriesLeft = data.optInt("caloriesLeft", 0)
            val totalCalories = data.optInt("totalCalories", 0)
            val dailyCalories = data.optInt("dailyCalories", 2000)
            
            val proteinLeft = data.optInt("proteinLeft", 0)
            val carbsLeft = data.optInt("carbsLeft", 0)
            val fatLeft = data.optInt("fatLeft", 0)

            for (appWidgetId in appWidgetIds) {
                val views = RemoteViews(context.packageName, R.layout.widget_macros)
                
                // Update calorie text
                views.setTextViewText(R.id.calories_value_small, caloriesLeft.toString())
                
                // Update calorie progress bar
                val progress = if (dailyCalories > 0) (totalCalories * 100) / dailyCalories else 0
                views.setProgressBar(R.id.calorie_progress, 100, progress, false)

                // Update macros text
                views.setTextViewText(R.id.protein_val, "${proteinLeft}g")
                views.setTextViewText(R.id.carbs_val, "${carbsLeft}g")
                views.setTextViewText(R.id.fats_val, "${fatLeft}g")

                // Setup deep link for scanner button
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("calzz://scanner"))
                val pendingIntent = PendingIntent.getActivity(
                    context, 1, intent, 
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.scan_food_button, pendingIntent)

                appWidgetManager.updateAppWidget(appWidgetId, views)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
