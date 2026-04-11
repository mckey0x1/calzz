package com.dormsdots

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences

class WidgetUpdaterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WidgetUpdater"
    }

    @ReactMethod
    fun updateWidget(data: String) {
        val context = reactApplicationContext
        val sharedPref = context.getSharedPreferences("WidgetData", Context.MODE_PRIVATE)
        with(sharedPref.edit()) {
            putString("widget_data", data)
            apply()
        }

        // Trigger updates for both widgets
        val calorieIntent = Intent(context, CalorieWidgetProvider::class.java).apply {
            action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        }
        val calorieIds = AppWidgetManager.getInstance(context).getAppWidgetIds(ComponentName(context, CalorieWidgetProvider::class.java))
        calorieIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, calorieIds)
        context.sendBroadcast(calorieIntent)

        val macrosIntent = Intent(context, MacrosWidgetProvider::class.java).apply {
            action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        }
        val macrosIds = AppWidgetManager.getInstance(context).getAppWidgetIds(ComponentName(context, MacrosWidgetProvider::class.java))
        macrosIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, macrosIds)
        context.sendBroadcast(macrosIntent)
    }
}
