function check_numbers() {
  var exit_code=system.run('/bin/sh', '-c', "exit $(expr 10.0 '<' 9.0 | bc)");
  if (exit_code != 0) {
    my.result.title = '10.0 is still not less then 9.0';
    my.result.message = 'Sorry, 10.0 is not less then 9.0. So, the installation fails!';
    my.result.type = 'Fatal';
    return false;
  }
  return true;
}
