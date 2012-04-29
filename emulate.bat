@echo off
cmd /c palm-package .
cmd /c palm-install com.palm.app.pushpop_1.0.0_all.ipk
cmd /c palm-launch com.palm.app.pushpop
