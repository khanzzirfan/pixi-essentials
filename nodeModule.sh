while :
do
	echo "Press [CTRL+C] to stop.."
    find . -name "node_modules" -type d -exec rm -rf '{}' +
    
	sleep 1
done