function check_numbers() {
  var exit_code=system.run('/bin/sh', '-c', "exit $(expr 9.0 '<' 10.0 | bc)");
  if (exit_code != 0) {
    my.result.title = '9.0 is not less then 10.0';
    my.result.message = 'Unfortunatelly, 9 is not less then 10. This is wrong, we should do something about it!';
    my.result.type = 'Fatal';
    return false;
  }
  return true;
}
