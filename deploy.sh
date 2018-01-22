#!/usr/bin/env bash
cd /Users/aabdurafieiev/project/libs/material/
echo "1"
gulp build


cp -R /Users/aabdurafieiev/project/libs/material/dist/* /Users/aabdurafieiev/project/libs/bower-material/
echo "2"
#cp -R /Users/aabdurafieiev/project/libs/bower-material/* /Users/aabdurafieiev/_work/onsdev/github/OnStandards.Web.dev/app/bower_components/angular-material
cp -R /Users/aabdurafieiev/project/libs/bower-material/* /Users/aabdurafieiev/project/git/Kenekt/Web/app/bower_components/angular-material
